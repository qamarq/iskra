import "server-only"
import { cosineDistance, isNotNull, sql } from "drizzle-orm"
import { z } from "zod"
import type { InnovationCard } from "@/lib/card"
import type { PartnerKind, Pathway, PathwayRecommendation } from "@/lib/domain"
import { structured } from "@/server/ai/client"
import { db } from "@/server/db"
import { match, partner } from "@/server/db/schema"

const PATHWAY_PARTNER_KINDS: Record<Pathway, PartnerKind[]> = {
  transfer: ["jst", "szkola", "uczelnia", "ngo"],
  komercjalizacja: ["firma", "inwestor", "ctt"],
  prototypowanie: ["akcelerator", "uczelnia", "firma"],
  finansowanie: ["program", "inwestor"],
  pilotaz: ["jst", "szkola", "firma", "ngo"],
  uzupelnienie: ["ctt", "akcelerator"],
}

const WEIGHTS = { similarity: 0.55, kind: 0.25, tags: 0.15, region: 0.05 }

export type PartnerCandidate = {
  id: number
  name: string
  kind: PartnerKind
  region: string | null
  description: string
  tags: string[]
  similarity: number
  kindFit: number
  tagFit: number
  score: number
}

export function kindFit(kind: PartnerKind, pathway: PathwayRecommendation): number {
  if (PATHWAY_PARTNER_KINDS[pathway.primary].includes(kind)) return 1
  if (pathway.secondary.some((p) => PATHWAY_PARTNER_KINDS[p].includes(kind))) return 0.5
  return 0
}

export function tagFit(tags: string[], card: InnovationCard): number {
  if (tags.length === 0) return 0
  const haystack = [card.domain, card.innovationType, ...card.keywords].join(" ").toLowerCase()
  const hits = tags.filter((t) => haystack.includes(t.toLowerCase())).length
  return Math.min(1, hits / Math.min(tags.length, 3))
}

export async function rankPartners(
  embedding: number[],
  card: InnovationCard,
  pathway: PathwayRecommendation,
  limit = 6,
): Promise<PartnerCandidate[]> {
  const distance = cosineDistance(partner.embedding, embedding)
  const rows = await db()
    .select({
      id: partner.id,
      name: partner.name,
      kind: partner.kind,
      region: partner.region,
      description: partner.description,
      tags: partner.tags,
      similarity: sql<number>`1 - (${distance})`,
    })
    .from(partner)
    .where(isNotNull(partner.embedding))
    .orderBy(distance)
    .limit(30)

  return rows
    .map((r) => {
      const similarity = Number(r.similarity)
      const kf = kindFit(r.kind, pathway)
      const tf = tagFit(r.tags, card)
      const regionFit = !r.region || r.region === "podkarpackie" ? 1 : 0
      const score =
        WEIGHTS.similarity * similarity + WEIGHTS.kind * kf + WEIGHTS.tags * tf + WEIGHTS.region * regionFit
      return { ...r, similarity, kindFit: kf, tagFit: tf, score: Math.round(score * 100) / 100 }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

const explanationSchema = z.object({
  items: z.array(
    z.object({
      partnerId: z.number().int(),
      reason: z.string().describe("Jedno zdanie: dlaczego ten partner pasuje do tej innowacji"),
      message: z.string().describe("Krótka wiadomość (3–4 zdania) od opiekuna PCI do partnera z propozycją kontaktu"),
    }),
  ),
})

const INSTRUCTIONS = `Jesteś opiekunem innowacji w Podkarpackim Centrum Innowacji. Dla każdego partnera z listy napisz po polsku:
- reason: jedno konkretne zdanie, dlaczego ten partner pasuje do innowacji (odwołaj się do profilu partnera i rekomendowanej ścieżki),
- message: krótką, uprzejmą wiadomość do partnera z propozycją rozmowy z twórcami. Bez danych kontaktowych, bez obietnic finansowych.`

function fallbackReason(c: PartnerCandidate, pathway: PathwayRecommendation): string {
  const parts = [`podobieństwo profilu ${Math.round(c.similarity * 100)}%`]
  if (c.kindFit === 1) parts.push(`typ partnera pasuje do ścieżki „${pathway.primary}”`)
  if (c.tagFit > 0) parts.push("wspólne obszary tematyczne")
  return `Dopasowanie: ${parts.join(", ")}.`
}

export async function matchPartners(
  innovationId: number,
  embedding: number[],
  card: InnovationCard,
  pathway: PathwayRecommendation,
): Promise<number> {
  const candidates = await rankPartners(embedding, card, pathway)
  if (candidates.length === 0) return 0

  let explanations = new Map<number, { reason: string; message: string }>()
  try {
    const input = `Innowacja:\n${JSON.stringify({ title: card.title, summary: card.summary, type: card.innovationType, domain: card.domain, institution: card.institution.name }, null, 2)}\n\nRekomendowana ścieżka: ${pathway.primary}\n\nPartnerzy:\n${candidates.map((c) => `- id ${c.id}: ${c.name} (${c.kind}): ${c.description}`).join("\n")}`
    const result = await structured(explanationSchema, "partner_explanations", INSTRUCTIONS, input)
    explanations = new Map(result.items.map((i) => [i.partnerId, { reason: i.reason, message: i.message }]))
  } catch (error) {
    console.error("partner explanation failed", error)
  }

  for (const c of candidates) {
    const explained = explanations.get(c.id)
    const values = {
      innovationId,
      partnerId: c.id,
      score: c.score,
      reason: explained?.reason ?? fallbackReason(c, pathway),
      message: explained?.message ?? null,
    }
    await db()
      .insert(match)
      .values(values)
      .onConflictDoUpdate({ target: [match.innovationId, match.partnerId], set: { score: values.score, reason: values.reason, message: values.message } })
  }
  return candidates.length
}
