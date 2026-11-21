import type { ImplementationLevel, InnovationCard } from "./card"
import type { Criterion } from "./domain"

export type CriterionInfo = {
  id: Criterion
  label: string
  question: string
  weight: number
  method: "karta" | "model"
  levels: { 1: string; 3: string; 5: string }
}

export const CRITERIA_INFO: CriterionInfo[] = [
  {
    id: "poziom_wdrozenia",
    label: "Poziom wdrożenia",
    question: "Na jakim etapie jest rozwiązanie: koncepcja, prototyp, testy, pilotaż czy stosowane w praktyce?",
    weight: 0.25,
    method: "karta",
    levels: { 1: "Koncepcja.", 3: "Testy.", 5: "Rozwiązanie stosowane w praktyce." },
  },
  {
    id: "dojrzalosc_technologiczna",
    label: "Dojrzałość technologiczna (TRL)",
    question: "Jaki poziom gotowości technologii (TRL 1–9)? Dotyczy tylko rozwiązań technologicznych.",
    weight: 0.15,
    method: "karta",
    levels: { 1: "TRL 1–2: badania podstawowe, koncepcja.", 3: "TRL 5–6: walidacja w warunkach zbliżonych do rzeczywistych.", 5: "TRL 9: system sprawdzony w działaniu." },
  },
  {
    id: "innowacyjnosc",
    label: "Innowacyjność",
    question: "Jak bardzo rozwiązanie różni się od istniejących (nowość dla instytucji, w Polsce, na świecie)?",
    weight: 0.3,
    method: "model",
    levels: {
      1: "Drobne usprawnienie znanego rozwiązania albo nowość tylko dla tej instytucji.",
      3: "Wyraźne ulepszenie, nowe w Polsce, choć podobne istnieją za granicą.",
      5: "Nowe podejście bez znanych odpowiedników (np. potwierdzone patentem).",
    },
  },
  {
    id: "potencjal_zastosowania",
    label: "Potencjał zastosowania",
    question: "Czy rozwiązanie można wykorzystać w innych instytucjach, organizacjach lub branżach?",
    weight: 0.3,
    method: "model",
    levels: {
      1: "Silnie związane z miejscem powstania, trudne do przeniesienia.",
      3: "Do przeniesienia do podobnych instytucji po dostosowaniu.",
      5: "Szerokie zastosowanie w wielu instytucjach lub branżach.",
    },
  },
]

export const CRITERIA_BY_ID = Object.fromEntries(CRITERIA_INFO.map((c) => [c.id, c])) as Record<Criterion, CriterionInfo>

export const LEVEL_SCORE: Record<ImplementationLevel, number> = { koncepcja: 1, prototyp: 2, testy: 3, pilotaz: 4, stosowane: 5 }

export function trlScore(trl: number | null): number | null {
  if (!trl) return null
  return Math.max(1, Math.min(5, Math.round((trl / 9) * 5)))
}

export function cardCriteria(card: InnovationCard): Partial<Record<Criterion, number>> {
  const scores: Partial<Record<Criterion, number>> = { poziom_wdrozenia: LEVEL_SCORE[card.implementation.value.level] }
  const trl = card.area === "technologiczna" ? trlScore(card.trl.value) : null
  if (trl != null) scores.dojrzalosc_technologiczna = trl
  return scores
}

export function potentialScore(scores: Partial<Record<Criterion, number>>): number {
  const used = CRITERIA_INFO.filter((c) => scores[c.id] != null)
  const weight = used.reduce((s, c) => s + c.weight, 0)
  if (!weight) return 0
  const total = used.reduce((s, c) => s + c.weight * ((scores[c.id] ?? 0) / 5), 0) / weight
  return Math.round(total * 1000) / 10
}

export function rubricText(ids: Criterion[]): string {
  return CRITERIA_INFO.filter((c) => ids.includes(c.id))
    .map((c) => `- ${c.id} (${c.label}): ${c.question}\n  1: ${c.levels[1]}\n  3: ${c.levels[3]}\n  5: ${c.levels[5]}`)
    .join("\n")
}
