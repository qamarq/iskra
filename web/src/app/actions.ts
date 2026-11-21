"use server"

import { eq } from "drizzle-orm"
import { refresh } from "next/cache"
import { CRITERIA, INNOVATION_STATUSES, type Criterion, type InnovationStatus } from "@/lib/domain"
import { db } from "@/server/db"
import { document, evaluation } from "@/server/db/schema"
import { analyzeInnovation, promoteDocument, rescore } from "@/server/pipeline/ingest"
import { logEvent, setStatus } from "@/server/pipeline/status"

export async function approveCandidate(documentId: number) {
  const result = await promoteDocument(documentId, { author: "analityk", note: "Kandydat z radaru zatwierdzony przez analityka" })
  return { slug: result.slug }
}

export async function rejectCandidate(documentId: number) {
  await db().update(document).set({ status: "odrzucony" }).where(eq(document.id, documentId))
  refresh()
}

export async function changeStatus(innovationId: number, status: InnovationStatus) {
  if (!INNOVATION_STATUSES.includes(status)) throw new Error("Nieznany status")
  await setStatus(innovationId, status)
  refresh()
}

export async function overrideCriterion(innovationId: number, criterion: Criterion, score: number, rationale: string) {
  if (!CRITERIA.includes(criterion)) throw new Error("Nieznane kryterium")
  const clamped = Math.min(5, Math.max(1, Math.round(score)))
  await db().insert(evaluation).values({ innovationId, criterion, score: clamped, rationale: rationale.trim() || "Korekta analityka", author: "analityk" })
  await rescore(innovationId)
  await logEvent(innovationId, "korekta_oceny", { author: "analityk", note: `${criterion}: ${clamped}/5` })
  refresh()
}

export async function reanalyze(innovationId: number) {
  await analyzeInnovation(innovationId)
  refresh()
}
