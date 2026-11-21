import "server-only"
import { z } from "zod"
import type { InnovationCard } from "@/lib/card"
import { rubricText } from "@/lib/criteria"
import { structured } from "@/server/ai/client"
import { OSLO_DEFINITION } from "./detect"

const MODEL_CRITERIA = ["innowacyjnosc", "potencjal_zastosowania"] as const
export type ModelCriterion = (typeof MODEL_CRITERIA)[number]

const criterionSchema = z.object({
  score: z.number().int().describe("Ocena 1–5"),
  rationale: z.string().describe("Jedno lub dwa zdania uzasadnienia po polsku, odwołujące się do faktów z karty"),
  evidence: z.string().nullable().describe("Fragment karty lub źródła, na którym opiera się ocena"),
})

const evaluationSchema = z.object({ innowacyjnosc: criterionSchema, potencjal_zastosowania: criterionSchema })

export type CriterionScore = z.infer<typeof criterionSchema>
export type ModelEvaluation = Record<ModelCriterion, CriterionScore>

export type ReferenceItem = { title: string; where: string | null; similarity?: number }

const INSTRUCTIONS = `Jesteś ekspertem radaru innowacji. Oceniasz dwa kryteria w skali 1–5 (2 i 4 to wartości pośrednie).

${OSLO_DEFINITION}

Rubryka:
${rubricText([...MODEL_CRITERIA])}

Zasady:
- Opieraj się tylko na karcie, liście podobnych rozwiązań i publikacji. Nie zgaduj faktów.
- Przy innowacyjności uwzględnij podobne rozwiązania: wysokie podobieństwo (powyżej 0,85) oznacza niższą nowość; patent lub zgłoszenie patentowe świadczą o nowości.
- Pola oznaczone w karcie jako "szacunek" traktuj ostrożniej niż "potwierdzone".`

export async function evaluateCard(card: InnovationCard, similar: ReferenceItem[], publications: ReferenceItem[]): Promise<ModelEvaluation> {
  const list = (items: ReferenceItem[], empty: string) =>
    items.length
      ? items.map((s) => `- ${s.title}${s.where ? " (" + s.where + ")" : ""}${s.similarity != null ? ", podobieństwo " + s.similarity.toFixed(2) : ""}`).join("\n")
      : empty
  const input = [
    "Karta innowacji:",
    JSON.stringify(card, null, 2),
    "",
    "Podobne rozwiązania w bazie radaru:",
    list(similar, "Brak."),
    "",
    "Powiązane publikacje naukowe:",
    list(publications, "Nie sprawdzano albo brak."),
  ].join("\n")
  const raw = await structured(evaluationSchema, "evaluation", INSTRUCTIONS, input)
  const clamp = (s: CriterionScore) => ({ ...s, score: Math.min(5, Math.max(1, Math.round(s.score))) })
  return { innowacyjnosc: clamp(raw.innowacyjnosc), potencjal_zastosowania: clamp(raw.potencjal_zastosowania) }
}
