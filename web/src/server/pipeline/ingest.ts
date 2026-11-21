import "server-only"
import { createHash } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { CRITERIA, DETECTION_THRESHOLD, DUPLICATE_THRESHOLD, SIMILAR_THRESHOLD, type Criterion } from "@/lib/domain"
import { slugify } from "@/lib/slug"
import { embed } from "@/server/ai/client"
import { db } from "@/server/db"
import { document, evaluation, innovation, institution, priorArt } from "@/server/db/schema"
import { fetchPage } from "@/server/sources/fetch-page"
import { detectInnovation } from "./detect"
import { evaluateCard } from "./evaluate"
import { cardEmbeddingText, extractCard } from "./extract"
import { matchPartners } from "./match"
import { recommendPathway } from "./pathway"
import { findSimilarInnovations } from "./similar"
import { recordCreated, setStatus } from "./status"

function contentHash(text: string): string {
  return createHash("sha256").update(text.replace(/\s+/g, " ").trim().toLowerCase()).digest("hex")
}

export async function storeDocument(input: {
  text: string
  url?: string | null
  title?: string | null
  sourceId?: number | null
  institutionId?: number | null
  publishedAt?: Date | null
}): Promise<{ id: number; created: boolean }> {
  const hash = contentHash(input.text)
  const [existing] = await db().select({ id: document.id }).from(document).where(eq(document.contentHash, hash))
  if (existing) return { id: existing.id, created: false }
  const [row] = await db()
    .insert(document)
    .values({
      text: input.text,
      url: input.url ?? null,
      title: input.title ?? null,
      sourceId: input.sourceId ?? null,
      institutionId: input.institutionId ?? null,
      publishedAt: input.publishedAt ?? null,
      contentHash: hash,
    })
    .returning({ id: document.id })
  return { id: row.id, created: true }
}

export async function screenDocument(documentId: number) {
  const [doc] = await db().select().from(document).where(eq(document.id, documentId))
  if (!doc) throw new Error(`Document ${documentId} not found`)
  const detection = await detectInnovation(doc.text)
  const status = detection.isInnovation && detection.score >= DETECTION_THRESHOLD ? "kandydat" : "odrzucony"
  await db().update(document).set({ detection, status }).where(eq(document.id, documentId))
  return { ...detection, status }
}

async function upsertInstitution(card: Awaited<ReturnType<typeof extractCard>>): Promise<number> {
  const [row] = await db()
    .insert(institution)
    .values({ name: card.institution.name, type: card.institution.type, city: card.institution.location })
    .onConflictDoUpdate({ target: institution.name, set: { type: card.institution.type } })
    .returning({ id: institution.id })
  return row.id
}

export async function promoteDocument(documentId: number, { author, note }: { author: string; note: string }) {
  const [linked] = await db()
    .select({ id: innovation.id, slug: innovation.slug })
    .from(innovation)
    .where(eq(innovation.documentId, documentId))
  if (linked) return linked

  const [doc] = await db().select().from(document).where(eq(document.id, documentId))
  if (!doc) throw new Error(`Document ${documentId} not found`)

  const card = await extractCard(doc.text, doc.url)
  const institutionId = await upsertInstitution(card)
  const [created] = await db()
    .insert(innovation)
    .values({
      slug: `tmp-${crypto.randomUUID()}`,
      title: card.title,
      summary: card.summary,
      type: card.innovationType,
      institutionId,
      documentId,
      card,
    })
    .returning({ id: innovation.id })
  const slug = `${slugify(card.title) || "innowacja"}-${created.id}`
  await db().update(innovation).set({ slug }).where(eq(innovation.id, created.id))
  await db().update(document).set({ status: "wyodrebniony", institutionId }).where(eq(document.id, documentId))

  await recordCreated(created.id, note, author)
  await setStatus(created.id, "zweryfikowana", { author, note: "Potwierdzone jako innowacja" })
  await analyzeInnovation(created.id)
  return { id: created.id, slug }
}

export async function analyzeInnovation(innovationId: number) {
  const [row] = await db()
    .select({ id: innovation.id, slug: innovation.slug, card: innovation.card })
    .from(innovation)
    .where(eq(innovation.id, innovationId))
  if (!row) throw new Error(`Innovation ${innovationId} not found`)
  const card = row.card

  const [embedding] = await embed([cardEmbeddingText(card)])
  const similar = await findSimilarInnovations(embedding, { excludeId: innovationId, limit: 5, minSimilarity: SIMILAR_THRESHOLD })
  const duplicate = similar.find((s) => s.similarity >= DUPLICATE_THRESHOLD)

  await db().delete(priorArt).where(and(eq(priorArt.innovationId, innovationId), eq(priorArt.source, "iskra")))
  if (similar.length) {
    await db()
      .insert(priorArt)
      .values(
        similar.map((s) => ({
          innovationId,
          source: "iskra" as const,
          externalId: String(s.id),
          title: s.title,
          url: `/innowacje/${s.slug}`,
          snippet: s.institution,
          similarity: s.similarity,
        })),
      )
  }

  const result = await evaluateCard(
    card,
    similar.map((s) => ({ title: s.title, institution: s.institution, similarity: s.similarity })),
  )
  await db()
    .insert(evaluation)
    .values(
      CRITERIA.map((c) => ({
        innovationId,
        criterion: c,
        score: result.criteria[c].score,
        rationale: result.criteria[c].rationale,
        evidence: result.criteria[c].evidence,
        confidence: result.criteria[c].confidence,
        author: "ai",
      })),
    )

  const scores = Object.fromEntries(CRITERIA.map((c) => [c, result.criteria[c].score])) as Record<Criterion, number>
  const pathway = recommendPathway(card, scores, result.confidence)

  await db()
    .update(innovation)
    .set({
      embedding,
      score: result.score,
      confidence: result.confidence,
      pathway,
      duplicateOfId: duplicate?.id ?? null,
      updatedAt: new Date(),
    })
    .where(eq(innovation.id, innovationId))
  await setStatus(innovationId, "oceniona", { note: `Wynik ${result.score}/100, pewność ${Math.round(result.confidence * 100)}%` })

  await matchPartners(innovationId, embedding, card, pathway)
  await setStatus(innovationId, "rekomendowana", { note: `Ścieżka: ${pathway.primary}` })

  return { score: result.score, confidence: result.confidence, pathway, similar, duplicateOf: duplicate ?? null }
}

export async function submit(input: { text?: string; url?: string; author?: string }) {
  let text = input.text?.trim() ?? ""
  let url = input.url?.trim() || null
  let title: string | null = null
  if (url && text.length < 200) {
    const page = await fetchPage(url)
    text = text ? `${text}\n\n${page.text}` : page.text
    title = page.title
    url = page.url
  }
  if (text.length < 80) throw new Error("Opis jest za krótki. Wklej co najmniej kilka zdań albo link do strony.")
  const doc = await storeDocument({ text, url, title })
  return promoteDocument(doc.id, { author: input.author ?? "zgłaszający", note: url ? `Zgłoszenie z linku: ${url}` : "Zgłoszenie przez formularz" })
}
