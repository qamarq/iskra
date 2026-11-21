import "server-only"
import { createHash } from "node:crypto"
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"
import type { InnovationCard } from "@/lib/card"
import { cardCriteria, potentialScore } from "@/lib/criteria"
import { CRITERIA, DETECTION_THRESHOLD, DUPLICATE_THRESHOLD, SIMILAR_THRESHOLD, type Criterion, type SourceKind } from "@/lib/domain"
import { STAGE_LABEL } from "@/lib/labels"
import { slugify } from "@/lib/slug"
import { embed } from "@/server/ai/client"
import { db } from "@/server/db"
import { document, evaluation, innovation, institution, priorArt, source } from "@/server/db/schema"
import { fetchPage } from "@/server/sources/fetch-page"
import { searchPublications } from "@/server/sources/openalex"
import { computeCredibility } from "./credibility"
import { detectInnovation } from "./detect"
import { evaluateCard } from "./evaluate"
import { cardEmbeddingText, extractCard } from "./extract"
import { matchPartners } from "./match"
import { recommend } from "./recommend"
import { findSimilarInnovations, type SimilarInnovation } from "./similar"
import { logEvent } from "./status"

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
}): Promise<{ id: number; created: boolean; innovationId: number | null }> {
  const hash = contentHash(input.text)
  const [existing] = await db().select({ id: document.id, innovationId: document.innovationId }).from(document).where(eq(document.contentHash, hash))
  if (existing) return { id: existing.id, created: false, innovationId: existing.innovationId }
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
  return { id: row.id, created: true, innovationId: null }
}

export async function screenDocument(documentId: number) {
  const [doc] = await db().select().from(document).where(eq(document.id, documentId))
  if (!doc) throw new Error(`Document ${documentId} not found`)
  const detection = await detectInnovation(doc.text)
  const status = detection.isInnovation && detection.score >= DETECTION_THRESHOLD ? "kandydat" : "odrzucony"
  await db().update(document).set({ detection, status }).where(eq(document.id, documentId))
  return { ...detection, status }
}

async function upsertInstitution(card: InnovationCard, region: string | null): Promise<number> {
  const [row] = await db()
    .insert(institution)
    .values({ name: card.institution.name, type: card.institution.type, city: card.institution.location, region })
    .onConflictDoUpdate({ target: institution.name, set: { type: card.institution.type } })
    .returning({ id: institution.id })
  return row.id
}

async function sourceKindsFor(innovationId: number): Promise<SourceKind[]> {
  const rows = await db()
    .selectDistinctOn([sql`coalesce(${document.url}, ${document.id}::text)`], { kind: source.kind })
    .from(document)
    .leftJoin(source, eq(document.sourceId, source.id))
    .where(eq(document.innovationId, innovationId))
  return rows.map((r) => r.kind ?? "analiza")
}

export async function recheckInnovations({ olderThanDays = 7, limit = 20 } = {}) {
  const stale = await db()
    .select({ id: innovation.id, title: innovation.title, url: document.url, hash: document.contentHash, sourceId: document.sourceId })
    .from(innovation)
    .innerJoin(document, eq(innovation.documentId, document.id))
    .where(sql`${innovation.checkedAt} < now() - make_interval(days => ${olderThanDays}) and ${innovation.status} <> 'odrzucona'`)
    .orderBy(asc(innovation.checkedAt))
    .limit(limit)
  const results: { title: string; status: string }[] = []
  for (const row of stale) {
    if (!row.url) continue
    try {
      const page = await fetchPage(row.url)
      if (contentHash(page.text) === row.hash) {
        await db().update(innovation).set({ checkedAt: new Date() }).where(eq(innovation.id, row.id))
        results.push({ title: row.title, status: "bez zmian" })
        continue
      }
      const doc = await storeDocument({ text: page.text, url: page.url, title: page.title, sourceId: row.sourceId })
      await db().update(document).set({ innovationId: row.id, status: "wyodrebniony" }).where(eq(document.id, doc.id))
      await logEvent(row.id, "aktualizacja", { note: "Źródło zmieniło się, ocena odświeżona" })
      await analyzeInnovation(row.id)
      results.push({ title: row.title, status: "zaktualizowana" })
    } catch (error) {
      results.push({ title: row.title, status: "błąd: " + (error instanceof Error ? error.message : String(error)) })
    }
  }
  return results
}

export async function promoteDocument(documentId: number, { author, note }: { author: string; note: string }) {
  const [doc] = await db().select().from(document).where(eq(document.id, documentId))
  if (!doc) throw new Error(`Document ${documentId} not found`)
  if (doc.innovationId) {
    const [linked] = await db().select({ id: innovation.id, slug: innovation.slug }).from(innovation).where(eq(innovation.id, doc.innovationId))
    if (linked) return { ...linked, merged: false }
  }

  const card = await extractCard(doc.text, doc.url)
  const [embedding] = await embed([cardEmbeddingText(card)])
  const similar = await findSimilarInnovations(embedding, { limit: 5, minSimilarity: SIMILAR_THRESHOLD })
  const duplicate = similar.find((s) => s.similarity >= DUPLICATE_THRESHOLD)

  if (duplicate) {
    await db().update(document).set({ innovationId: duplicate.id, status: "wyodrebniony" }).where(eq(document.id, documentId))
    await logEvent(duplicate.id, "nowe_zrodlo", { note: doc.url ?? doc.title ?? "nowe źródło", author })
    await analyzeInnovation(duplicate.id)
    return { id: duplicate.id, slug: duplicate.slug, merged: true }
  }

  const [docInstitution] = doc.institutionId
    ? await db().select({ region: institution.region }).from(institution).where(eq(institution.id, doc.institutionId))
    : []
  const region = docInstitution?.region ?? null
  const institutionId = await upsertInstitution(card, region)
  const [created] = await db()
    .insert(innovation)
    .values({
      slug: `tmp-${crypto.randomUUID()}`,
      title: card.title,
      summary: card.summary,
      area: card.area,
      character: card.character,
      level: card.implementation.value.level,
      trl: card.trl.value,
      region,
      institutionId,
      documentId,
      card,
      embedding,
    })
    .returning({ id: innovation.id })
  const slug = `${slugify(card.title) || "innowacja"}-${created.id}`
  await db().update(innovation).set({ slug }).where(eq(innovation.id, created.id))
  await db().update(document).set({ status: "wyodrebniony", innovationId: created.id }).where(eq(document.id, documentId))
  await logEvent(created.id, "dodana", { note, author })
  await analyzeInnovation(created.id, similar)
  return { id: created.id, slug, merged: false }
}

export async function latestScores(innovationId: number) {
  const rows = await db()
    .selectDistinctOn([evaluation.criterion], { criterion: evaluation.criterion, score: evaluation.score, author: evaluation.author })
    .from(evaluation)
    .where(eq(evaluation.innovationId, innovationId))
    .orderBy(evaluation.criterion, desc(evaluation.createdAt))
  return new Map(rows.map((r) => [r.criterion, r]))
}

export async function rescore(innovationId: number) {
  const [row] = await db().select({ card: innovation.card, embedding: innovation.embedding }).from(innovation).where(eq(innovation.id, innovationId))
  const latest = await latestScores(innovationId)
  const scores = Object.fromEntries(CRITERIA.filter((c) => latest.has(c)).map((c) => [c, latest.get(c)!.score])) as Partial<Record<Criterion, number>>
  const credibility = computeCredibility(row.card, await sourceKindsFor(innovationId))
  const rec = recommend(row.card, scores, credibility.score)
  await db()
    .update(innovation)
    .set({
      potential: potentialScore(scores),
      credibility: credibility.score,
      credibilityDetail: credibility,
      recommendation: rec,
      updatedAt: new Date(),
    })
    .where(eq(innovation.id, innovationId))
  return { scores, credibility, rec, card: row.card, embedding: row.embedding }
}

export async function analyzeInnovation(innovationId: number, knownSimilar?: SimilarInnovation[]) {
  const [row] = await db()
    .select({ id: innovation.id, card: innovation.card, embedding: innovation.embedding })
    .from(innovation)
    .where(eq(innovation.id, innovationId))
  if (!row) throw new Error(`Innovation ${innovationId} not found`)
  const card = row.card
  const embedding = row.embedding ?? (await embed([cardEmbeddingText(card)]))[0]
  if (!row.embedding) await db().update(innovation).set({ embedding }).where(eq(innovation.id, innovationId))

  const similar = (knownSimilar ?? (await findSimilarInnovations(embedding, { excludeId: innovationId, limit: 5, minSimilarity: SIMILAR_THRESHOLD }))).filter(
    (s) => s.id !== innovationId,
  )
  const publications = await searchPublications(card).catch(() => [])

  await db().delete(priorArt).where(and(eq(priorArt.innovationId, innovationId), inArray(priorArt.source, ["iskra", "openalex"])))
  const priorRows = [
    ...similar.map((s) => ({ innovationId, source: "iskra" as const, externalId: String(s.id), title: s.title, url: `/innowacje/${s.slug}`, snippet: s.institution, similarity: s.similarity })),
    ...publications.map((p) => ({
      innovationId,
      source: "openalex" as const,
      externalId: p.id,
      title: p.title,
      url: p.url,
      snippet: [p.venue, p.year].filter(Boolean).join(", ") || null,
      similarity: null,
    })),
  ]
  if (priorRows.length) await db().insert(priorArt).values(priorRows)

  const model = await evaluateCard(
    card,
    similar.map((s) => ({ title: s.title, where: s.institution, similarity: s.similarity })),
    publications.map((p) => ({ title: p.title, where: [p.venue, p.year].filter(Boolean).join(", ") || null })),
  )
  const latest = await latestScores(innovationId)
  const fromCard = cardCriteria(card)
  const level = card.implementation.value.level
  const inserts: (typeof evaluation.$inferInsert)[] = []
  if (fromCard.poziom_wdrozenia != null) {
    inserts.push({ innovationId, criterion: "poziom_wdrozenia", score: fromCard.poziom_wdrozenia, rationale: `Etap z karty: ${STAGE_LABEL[level]}.`, evidence: card.implementation.quote, author: "karta" })
  }
  if (fromCard.dojrzalosc_technologiczna != null) {
    inserts.push({ innovationId, criterion: "dojrzalosc_technologiczna", score: fromCard.dojrzalosc_technologiczna, rationale: `TRL ${card.trl.value} przeliczony na skalę 1–5.`, evidence: card.trl.quote, author: "karta" })
  }
  for (const c of ["innowacyjnosc", "potencjal_zastosowania"] as const) {
    if (latest.get(c)?.author === "analityk") continue
    inserts.push({ innovationId, criterion: c, score: model[c].score, rationale: model[c].rationale, evidence: model[c].evidence, author: "model" })
  }
  await db().insert(evaluation).values(inserts)

  const { scores, credibility, rec } = await rescore(innovationId)
  await db().update(innovation).set({ checkedAt: new Date() }).where(eq(innovation.id, innovationId))
  await matchPartners(innovationId, embedding, card, rec)
  await logEvent(innovationId, "ocena", { note: `Potencjał ${potentialScore(scores)}/100, wiarygodność ${credibility.score}/100` })
  return { potential: potentialScore(scores), credibility: credibility.score, recommendation: rec, similar }
}

async function analysisSourceId(): Promise<number> {
  const [found] = await db().select({ id: source.id }).from(source).where(eq(source.kind, "analiza"))
  if (found) return found.id
  const [created] = await db().insert(source).values({ kind: "analiza", name: "Analiza źródła przez użytkownika" }).returning({ id: source.id })
  return created.id
}

export async function analyzeSource(input: { url: string; author?: string }) {
  const page = await fetchPage(input.url)
  const doc = await storeDocument({ text: page.text, url: page.url, title: page.title, sourceId: await analysisSourceId() })
  if (doc.innovationId) {
    const [linked] = await db().select({ slug: innovation.slug }).from(innovation).where(eq(innovation.id, doc.innovationId))
    if (linked) return { ok: true as const, slug: linked.slug, merged: false }
  }
  const screened = await screenDocument(doc.id)
  if (screened.status !== "kandydat") return { ok: false as const, reason: screened.reason, score: screened.score }
  const result = await promoteDocument(doc.id, { author: input.author ?? "analityk", note: `Analiza źródła: ${page.url}` })
  return { ok: true as const, slug: result.slug, merged: result.merged }
}
