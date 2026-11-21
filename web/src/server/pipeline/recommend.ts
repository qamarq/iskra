import type { InnovationCard } from "@/lib/card"
import type { Criterion, Recommendation, RecommendationResult } from "@/lib/domain"

const NEXT_STEPS: Record<Recommendation, string[]> = {
  wdrozenie: [
    "Rozwiązanie działa w praktyce: skontaktuj się z instytucją, która je stosuje, i poproś o opis wdrożenia.",
    "Sprawdź, czy w Twojej instytucji występuje ten sam problem i jakie zasoby są potrzebne.",
    "Uzupełnij brakujące informacje o kosztach przed decyzją.",
  ],
  licencja: [
    "Rozwiązanie jest chronione (polskie IP): skontaktuj się z centrum transferu technologii właściciela.",
    "Sprawdź status ochrony w bazie Urzędu Patentowego RP.",
    "Oceń możliwość licencji lub wspólnego rozwoju z twórcami.",
  ],
  pilotaz: [
    "Rozwiązanie jest testowane: warto obserwować wyniki pilotażu albo zaproponować drugi pilotaż.",
    "Ustal, jakie mierniki potwierdzą działanie poza miejscem powstania.",
  ],
  rozwoj: [
    "Wczesny etap: rozwiązanie wymaga prototypu lub walidacji.",
    "Właściwi odbiorcy to laboratoria, akceleratory i partnerzy badawczy.",
  ],
  weryfikacja: [
    "Informacje są słabo potwierdzone: zanim ktoś na nich oprze decyzję, trzeba znaleźć dodatkowe źródło.",
    "Sprawdź stronę twórców, bazy patentowe i projekty finansowane.",
  ],
}

const RANK = { koncepcja: 1, prototyp: 2, testy: 3, pilotaz: 4, stosowane: 5 } as const

export function recommend(card: InnovationCard, scores: Partial<Record<Criterion, number>>, credibility: number): RecommendationResult {
  const level = card.implementation.value.level
  const potential = scores.potencjal_zastosowania ?? 0
  const candidates: { r: Recommendation; reason: string }[] = []

  if (card.ip.value && RANK[level] >= RANK.prototyp) {
    const ip = card.ip.value.length > 70 ? card.ip.value.slice(0, 67) + "…" : card.ip.value
    candidates.push({ r: "licencja", reason: `Rozwiązanie ma ochronę lub zgłoszenie (${ip}) i działający prototyp lub wdrożenie.` })
  }
  if (level === "stosowane" && potential >= 3) {
    candidates.push({ r: "wdrozenie", reason: `Stosowane w praktyce, z potencjałem zastosowania ${potential}/5 w innych miejscach.` })
  }
  if (level === "testy" || level === "pilotaz") {
    candidates.push({ r: "pilotaz", reason: `Etap: ${level === "testy" ? "testy" : "pilotaż"}; wyniki potwierdzą przydatność poza miejscem powstania.` })
  }
  if (level === "koncepcja" || level === "prototyp") {
    candidates.push({ r: "rozwoj", reason: `Etap: ${level}; potrzebny rozwój i walidacja.` })
  }
  if (candidates.length === 0) {
    candidates.push({ r: "wdrozenie", reason: "Rozwiązanie stosowane w praktyce, o ograniczonym potencjale przeniesienia." })
  }
  if (credibility < 40) {
    candidates.unshift({ r: "weryfikacja", reason: `Wiarygodność ${credibility}/100: brakuje potwierdzeń w źródłach.` })
  }

  const [primary, ...rest] = candidates
  return {
    primary: primary.r,
    secondary: [...new Set(rest.map((c) => c.r))].filter((r) => r !== primary.r),
    reasons: candidates.map((c) => c.reason),
    nextSteps: NEXT_STEPS[primary.r],
  }
}
