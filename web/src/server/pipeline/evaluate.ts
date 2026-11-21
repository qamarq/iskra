import "server-only"
import { z } from "zod"
import type { InnovationCard } from "@/lib/card"
import { CRITERIA_INFO, rubricText, weightedScore } from "@/lib/criteria"
import { CRITERIA, type Criterion } from "@/lib/domain"
import { structured } from "@/server/ai/client"
import { cardCompleteness } from "./extract"

const criterionSchema = z.object({
  score: z.number().int().describe("Ocena 0–5"),
  rationale: z.string().describe("Jedno lub dwa zdania uzasadnienia po polsku"),
  evidence: z.string().nullable().describe("Dosłowny cytat z karty lub źródła, na którym opiera się ocena"),
  confidence: z.number().describe("Pewność 0–1; niska, gdy brakuje danych"),
})

const evaluationSchema = z.object(Object.fromEntries(CRITERIA.map((c) => [c, criterionSchema])) as Record<Criterion, typeof criterionSchema>)

export type CriterionScore = z.infer<typeof criterionSchema>
export type Evaluation = {
  criteria: Record<Criterion, CriterionScore>
  score: number
  confidence: number
}

export type SimilarRef = { title: string; institution: string | null; similarity: number }

const INSTRUCTIONS = `Jesteś ekspertem Podkarpackiego Centrum Innowacji. Oceniasz innowację z instytucji publicznej według jawnych kryteriów. Każde kryterium oceniasz w skali 0–5 (0 = nie da się ocenić lub brak spełnienia, 1/3/5 opisane w rubryce, 2 i 4 to wartości pośrednie).

Rubryka:
${rubricText()}

Zasady:
- Opieraj się tylko na karcie innowacji i liście podobnych rozwiązań. Brak informacji obniża pewność (confidence), a ocenę ustaw ostrożnie.
- Przy kryterium nowosc uwzględnij podobne rozwiązania: wysokie podobieństwo (powyżej 0,85) oznacza niską nowość.
- Przy koszt: 5 oznacza tanie i proste wdrożenie, 1 drogie i trudne.
- Uzasadnienie ma być konkretne i odwoływać się do faktów z karty.`

export async function evaluateCard(card: InnovationCard, similar: SimilarRef[]): Promise<Evaluation> {
  const similarText = similar.length
    ? similar.map((s) => `- ${s.title} (${s.institution ?? "nieznana instytucja"}), podobieństwo ${s.similarity.toFixed(2)}`).join("\n")
    : "Brak podobnych rozwiązań w bazie."
  const input = `Karta innowacji:\n${JSON.stringify(card, null, 2)}\n\nPodobne rozwiązania w bazie ISKRA:\n${similarText}`
  const raw = await structured(evaluationSchema, "evaluation", INSTRUCTIONS, input)

  const criteria = Object.fromEntries(
    CRITERIA.map((c) => {
      const r = raw[c]
      return [c, { ...r, score: Math.min(5, Math.max(0, Math.round(r.score))), confidence: Math.min(1, Math.max(0, r.confidence)) }]
    }),
  ) as Record<Criterion, CriterionScore>

  return { criteria, ...summarize(criteria, card) }
}

export function summarize(criteria: Record<Criterion, Pick<CriterionScore, "score" | "confidence">>, card: InnovationCard) {
  const scores = Object.fromEntries(CRITERIA.map((c) => [c, criteria[c].score])) as Record<Criterion, number>
  const modelConfidence = CRITERIA_INFO.reduce((sum, c) => sum + c.weight * criteria[c.id].confidence, 0)
  const confidence = Math.round((0.5 * modelConfidence + 0.5 * cardCompleteness(card)) * 100) / 100
  return { score: weightedScore(scores), confidence }
}
