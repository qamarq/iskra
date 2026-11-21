import type { Criterion } from "./domain"

export type CriterionInfo = {
  id: Criterion
  label: string
  question: string
  weight: number
  levels: { 1: string; 3: string; 5: string }
}

export const CRITERIA_INFO: CriterionInfo[] = [
  {
    id: "waga_problemu",
    label: "Waga problemu",
    question: "Jak dotkliwy i jak częsty jest problem, który rozwiązuje innowacja?",
    weight: 0.2,
    levels: {
      1: "Problem niszowy albo mało dotkliwy, dotyczy pojedynczych osób.",
      3: "Problem odczuwalny dla całej instytucji lub grupy odbiorców.",
      5: "Problem powszechny i kosztowny, dotyczy wielu instytucji lub dużej grupy mieszkańców.",
    },
  },
  {
    id: "nowosc",
    label: "Nowość",
    question: "Czy podobne rozwiązanie już istnieje (w bazie ISKRA, patentach, publikacjach)?",
    weight: 0.15,
    levels: {
      1: "Rozwiązanie powszechnie znane i stosowane.",
      3: "Znane gdzie indziej, ale nowe w tym typie instytucji lub regionie.",
      5: "Brak znanych odpowiedników, oryginalne podejście.",
    },
  },
  {
    id: "dojrzalosc",
    label: "Dojrzałość",
    question: "Na jakim etapie jest rozwiązanie (TRL dla technologii, etap wdrożenia dla pozostałych)?",
    weight: 0.15,
    levels: {
      1: "Pomysł lub koncepcja (TRL 1–2).",
      3: "Prototyp lub pilotaż w jednym miejscu (TRL 4–6).",
      5: "Działa na co dzień, z udokumentowanym wdrożeniem (TRL 8–9).",
    },
  },
  {
    id: "efekty",
    label: "Potwierdzone efekty",
    question: "Czy są liczby i dowody, że rozwiązanie działa?",
    weight: 0.15,
    levels: {
      1: "Brak danych o efektach, tylko deklaracje.",
      3: "Pojedyncze liczby lub opinie użytkowników.",
      5: "Zmierzone efekty z porównaniem przed i po.",
    },
  },
  {
    id: "przenaszalnosc",
    label: "Przenaszalność",
    question: "Ile innych instytucji ma ten problem i czy rozwiązanie zadziała poza miejscem powstania?",
    weight: 0.2,
    levels: {
      1: "Silnie związane z lokalnymi warunkami, trudne do powtórzenia.",
      3: "Do przeniesienia po dostosowaniu, w podobnych instytucjach.",
      5: "Gotowe do powtórzenia w wielu instytucjach, opisane krok po kroku.",
    },
  },
  {
    id: "koszt",
    label: "Koszt wdrożenia",
    question: "Ile kosztuje i czego wymaga przeniesienie rozwiązania (5 = tanio i prosto)?",
    weight: 0.15,
    levels: {
      1: "Wysoki koszt, specjalistyczny sprzęt lub zespół.",
      3: "Umiarkowany koszt, w zasięgu budżetu instytucji lub grantu.",
      5: "Niski koszt, wystarczą istniejące zasoby.",
    },
  },
]

export const CRITERIA_BY_ID = Object.fromEntries(CRITERIA_INFO.map((c) => [c.id, c])) as Record<Criterion, CriterionInfo>

export function weightedScore(scores: Record<Criterion, number>): number {
  const total = CRITERIA_INFO.reduce((sum, c) => sum + c.weight * (scores[c.id] / 5), 0)
  return Math.round(total * 1000) / 10
}

export function rubricText(): string {
  return CRITERIA_INFO.map(
    (c) =>
      `- ${c.id} (${c.label}, waga ${Math.round(c.weight * 100)}%): ${c.question}\n  1: ${c.levels[1]}\n  3: ${c.levels[3]}\n  5: ${c.levels[5]}`,
  ).join("\n")
}
