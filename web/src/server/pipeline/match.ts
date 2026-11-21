import "server-only"
import { cosineDistance, isNotNull, sql } from "drizzle-orm"
import { z } from "zod"
import type { InnovationCard } from "@/lib/card"
import type { PartnerKind, Recommendation, RecommendationResult } from "@/lib/domain"
import { structured } from "@/server/ai/client"
import { db } from "@/server/db"
import { match, partner } from "@/server/db/schema"

const RECOMMENDATION_PARTNER_KINDS: Record<Recommendation, PartnerKind[]> = {
  wdrozenie: ["jst", "szkola", "uczelnia", "firma", "ngo"],
  licencja: ["firma", "ctt", "inwestor"],
  pilotaz: ["jst", "szkola", "firma", "ngo"],
  rozwoj: ["akcelerator", "uczelnia", "ctt", "firma"],
  weryfikacja: ["ctt", "uczelnia"],
}

const WEIGHTS = { similarity: 0.6, kind: 0.25, tags: 0.15 }

export type PartnerCandidate = {
  id: number
  name: string
  kind: PartnerKind
  description: string
  tags: string[]
  similarity: number
  kindFit: number
  tagFit: number
  score: number
}

export function kindFit(kind: PartnerKind, rec: RecommendationResult): number {
  if (RECOMMENDATION_PARTNER_KINDS[rec.primary].includes(kind)) return 1
  if (rec.secondary.some((r) => RECOMMENDATION_PARTNER_KINDS[r].includes(kind))) return 0.5
  return 0
}

export function tagFit(tags: string[], card: InnovationCard): number {
  if (tags.length === 0) return 0
  const haystack = [card.domain, card.area, ...card.keywords, ...card.applications.map((a) => a.where)].join(" ").toLowerCase()
  const hits = tags.filter((t) => haystack.includes(t.toLowerCase())).length
  return Math.min(1, hits / Math.min(tags.length, 3))
}

export async function rankPartners(embedding: number[], card: InnovationCard, rec: RecommendationResult, limit = 5): Promise<PartnerCandidate[]> {
  const distance = cosineDistance(partner.embedding, embedding)
  const rows = await db()
    .select({
      id: partner.id,
      name: partner.name,
      kind: partner.kind,
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
      const kf = kindFit(r.kind, rec)
      const tf = tagFit(r.tags, card)
      const score = WEIGHTS.similarity * similarity + WEIGHTS.kind * kf + WEIGHTS.tags * tf
      return { ...r, similarity, kindFit: kf, tagFit: tf, score: Math.round(score * 100) / 100 }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

const explanationSchema = z.object({
  items: z.array(z.object({ partnerId: z.number().int(), reason: z.string().describe("Jedno zdanie: jak ten podmiot mógłby wykorzystać rozwiązanie") })),
})

const INSTRUCTIONS = `Jesteś analitykiem radaru innowacji. Dla każdego podmiotu z listy napisz po polsku jedno konkretne zdanie: jak mógłby wykorzystać, wdrożyć, licencjonować lub rozwijać opisane rozwiązanie. Odwołuj się do profilu podmiotu. Nie pisz o finansowaniu ani inwestowaniu w twórców.`

function fallbackReason(c: PartnerCandidate): string {
  const parts = [`podobieństwo profilu ${Math.round(c.similarity * 100)}%`]
  if (c.kindFit === 1) parts.push("typ podmiotu pasuje do rekomendacji")
  if (c.tagFit > 0) parts.push("wspólne obszary tematyczne")
  return `Dopasowanie: ${parts.join(", ")}.`
}

export async function matchPartners(innovationId: number, embedding: number[], card: InnovationCard, rec: RecommendationResult): Promise<number> {
  const candidates = await rankPartners(embedding, card, rec)
  if (candidates.length === 0) return 0
  let reasons = new Map<number, string>()
  try {
    const input = `Rozwiązanie:\n${JSON.stringify({ title: card.title, summary: card.summary, area: card.area, level: card.implementation.value.level, domain: card.domain }, null, 2)}\n\nRekomendacja: ${rec.primary}\n\nPodmioty:\n${candidates.map((c) => `- id ${c.id}: ${c.name} (${c.kind}): ${c.description}`).join("\n")}`
    const result = await structured(explanationSchema, "application_reasons", INSTRUCTIONS, input)
    reasons = new Map(result.items.map((i) => [i.partnerId, i.reason]))
  } catch (error) {
    console.error("partner explanation failed", error)
  }
  await db().delete(match).where(sql`${match.innovationId} = ${innovationId}`)
  await db()
    .insert(match)
    .values(candidates.map((c) => ({ innovationId, partnerId: c.id, score: c.score, reason: reasons.get(c.id) ?? fallbackReason(c) })))
  return candidates.length
}
