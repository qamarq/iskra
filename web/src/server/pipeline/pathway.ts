import type { InnovationCard } from "@/lib/card"
import type { Criterion, Pathway, PathwayRecommendation } from "@/lib/domain"

const NEXT_STEPS: Record<Pathway, string[]> = {
  transfer: [
    "Przygotować jednostronicowy opis „jak to powtórzyć” (kroki, czas, koszt, potrzebne osoby).",
    "Skontaktować twórców z 2–3 instytucjami, które mają ten sam problem.",
    "Zorganizować wizytę studyjną lub webinar u twórców.",
  ],
  komercjalizacja: [
    "Zgłosić rozwiązanie do centrum transferu technologii uczelni i sprawdzić możliwość ochrony patentowej.",
    "Zweryfikować rynek: 5 rozmów z potencjalnymi klientami.",
    "Przygotować model licencji albo spółki spin-off i spotkanie z inwestorem.",
  ],
  prototypowanie: [
    "Zbudować prototyp w PCI ProtoLab (druk 3D, elektronika, testy).",
    "Zgłosić zespół do programu akceleracyjnego PCI.",
    "Ustalić mierniki, które potwierdzą działanie prototypu.",
  ],
  finansowanie: [
    "Dopasować rozwiązanie do naboru (FEPK, NCBR, Interreg, granty samorządowe).",
    "Przygotować budżet i harmonogram wdrożenia.",
    "Znaleźć partnera do wniosku konsorcjalnego.",
  ],
  pilotaz: [
    "Znaleźć instytucję partnerską do pilotażu na 3–6 miesięcy.",
    "Ustalić mierniki przed startem pilotażu (stan wyjściowy).",
    "Po pilotażu opublikować wyniki w ISKRA.",
  ],
  uzupelnienie: [
    "Wysłać twórcom pytania o brakujące informacje.",
    "Po uzupełnieniu powtórzyć ocenę.",
  ],
}

const EARLY = new Set(["pomysl", "prototyp"])
const RUNNING = new Set(["wdrozone", "efekty_zmierzone"])

export function recommendPathway(
  card: InnovationCard,
  scores: Record<Criterion, number>,
  confidence: number,
): PathwayRecommendation {
  const stage = card.maturity.value.stage
  const trl = card.maturity.value.trl
  const tech = card.innovationType === "technologiczna"
  const candidates: { pathway: Pathway; reason: string }[] = []

  if (tech && scores.nowosc >= 4 && ((trl ?? 0) >= 4 || !EARLY.has(stage))) {
    candidates.push({ pathway: "komercjalizacja", reason: `Technologia o wysokiej nowości (${scores.nowosc}/5) na etapie ${trl ? `TRL ${trl}` : stage}.` })
  }
  if (EARLY.has(stage) || (tech && (trl ?? 0) > 0 && (trl ?? 0) <= 4)) {
    candidates.push({ pathway: "prototypowanie", reason: `Wczesny etap (${trl ? `TRL ${trl}` : stage}): potrzebny prototyp i walidacja.` })
  }
  if (scores.przenaszalnosc >= 4 && RUNNING.has(stage)) {
    candidates.push({ pathway: "transfer", reason: `Działa na co dzień i jest łatwe do przeniesienia (przenaszalność ${scores.przenaszalnosc}/5).` })
  }
  if (stage === "pilotaz" || (stage === "wdrozone" && scores.efekty <= 2)) {
    candidates.push({ pathway: "pilotaz", reason: `Brakuje zmierzonych efektów (efekty ${scores.efekty}/5): pilotaż u partnera je potwierdzi.` })
  }
  if (scores.koszt <= 2 || (scores.waga_problemu >= 4 && EARLY.has(stage))) {
    candidates.push({ pathway: "finansowanie", reason: `Wdrożenie wymaga środków (koszt ${scores.koszt}/5) przy istotnym problemie (${scores.waga_problemu}/5).` })
  }
  if (candidates.length === 0) {
    candidates.push({ pathway: scores.przenaszalnosc >= 3 ? "transfer" : "pilotaz", reason: "Rozwiązanie działa lokalnie; kolejnym krokiem jest sprawdzenie go w innej instytucji." })
  }

  if (confidence < 0.45) {
    candidates.unshift({ pathway: "uzupelnienie", reason: `Pewność oceny jest niska (${Math.round(confidence * 100)}%): brakuje ${card.missing.slice(0, 3).join(", ") || "kluczowych informacji"}.` })
  }

  const [primary, ...rest] = candidates
  return {
    primary: primary.pathway,
    secondary: [...new Set(rest.map((c) => c.pathway))].filter((p) => p !== primary.pathway),
    reasons: candidates.map((c) => c.reason),
    nextSteps: NEXT_STEPS[primary.pathway],
  }
}
