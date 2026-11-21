"use server"

import { and, desc, eq } from "drizzle-orm"
import { refresh } from "next/cache"
import { CRITERIA, INNOVATION_STATUSES, MATCH_STATUSES, type Criterion, type InnovationStatus, type MatchStatus } from "@/lib/domain"
import { db } from "@/server/db"
import { document, evaluation, innovation, match } from "@/server/db/schema"
import { summarize } from "@/server/pipeline/evaluate"
import { analyzeInnovation, promoteDocument } from "@/server/pipeline/ingest"
import { recommendPathway } from "@/server/pipeline/pathway"
import { setStatus } from "@/server/pipeline/status"

export async function approveCandidate(documentId: number) {
  const result = await promoteDocument(documentId, { author: "opiekun", note: "Kandydat z radaru zatwierdzony przez opiekuna" })
  return { slug: result.slug }
}

export async function rejectCandidate(documentId: number) {
  await db().update(document).set({ status: "odrzucony" }).where(eq(document.id, documentId))
  refresh()
}

export async function changeStatus(innovationId: number, status: InnovationStatus, note?: string) {
  if (!INNOVATION_STATUSES.includes(status)) throw new Error("Nieznany status")
  await setStatus(innovationId, status, { author: "opiekun", note, onlyForward: false })
  refresh()
}

export async function changeMatchStatus(matchId: number, status: MatchStatus) {
  if (!MATCH_STATUSES.includes(status)) throw new Error("Nieznany status")
  const [updated] = await db().update(match).set({ status }).where(eq(match.id, matchId)).returning({ innovationId: match.innovationId })
  if (updated && (status === "wyslane" || status === "zainteresowany")) {
    await setStatus(updated.innovationId, "w_kontakcie", { author: "opiekun", note: "Wysłano propozycję do partnera" })
  }
  refresh()
}

export async function overrideCriterion(innovationId: number, criterion: Criterion, score: number, rationale: string) {
  if (!CRITERIA.includes(criterion)) throw new Error("Nieznane kryterium")
  const clamped = Math.min(5, Math.max(0, Math.round(score)))
  await db().insert(evaluation).values({
    innovationId,
    criterion,
    score: clamped,
    rationale: rationale.trim() || "Korekta opiekuna",
    confidence: 1,
    author: "opiekun",
  })

  const [row] = await db().select({ card: innovation.card }).from(innovation).where(eq(innovation.id, innovationId))
  const latest = await Promise.all(
    CRITERIA.map((c) =>
      db()
        .select({ score: evaluation.score, confidence: evaluation.confidence })
        .from(evaluation)
        .where(and(eq(evaluation.innovationId, innovationId), eq(evaluation.criterion, c)))
        .orderBy(desc(evaluation.createdAt))
        .limit(1)
        .then((r) => [c, r[0] ?? { score: 0, confidence: 0 }] as const),
    ),
  )
  const criteria = Object.fromEntries(latest) as Record<Criterion, { score: number; confidence: number }>
  const summary = summarize(criteria, row.card)
  const scores = Object.fromEntries(CRITERIA.map((c) => [c, criteria[c].score])) as Record<Criterion, number>
  const pathway = recommendPathway(row.card, scores, summary.confidence)
  await db()
    .update(innovation)
    .set({ score: summary.score, confidence: summary.confidence, pathway, updatedAt: new Date() }).where(eq(innovation.id, innovationId))
  refresh()
}

export async function reanalyze(innovationId: number) {
  await analyzeInnovation(innovationId)
  refresh()
}
