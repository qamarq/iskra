import "server-only"
import { innovationCardSchema, type InnovationCard } from "@/lib/card"
import { structured } from "@/server/ai/client"

const INSTRUCTIONS = `Jesteś analitykiem Podkarpackiego Centrum Innowacji. Z podanego tekstu tworzysz kartę innowacji po polsku.

Zasady:
- Używaj wyłącznie informacji z tekstu. Niczego nie dopowiadaj.
- Przy polach z cytatem (quote) wpisz dosłowny fragment tekstu, który potwierdza wartość. Gdy tekst nie zawiera informacji, ustaw value na null (albo najbliższą wartość dla etapu) i quote na null.
- Typ innowacji: technologiczna (urządzenie, oprogramowanie, materiał, metoda techniczna), organizacyjna (sposób zarządzania, procedura), edukacyjna (program, metoda nauczania), społeczna (usługa dla mieszkańców, włączenie grup), procesowa (usprawnienie procesu w urzędzie lub instytucji).
- Etap dojrzałości: pomysl, prototyp, pilotaz (testowane w ograniczonym zakresie), wdrozone (działa na co dzień), efekty_zmierzone (działa i są zmierzone wyniki).
- TRL podawaj tylko dla innowacji technologicznych, w pozostałych przypadkach null.
- Twórcy: rola (np. nauczycielka fizyki, zespół Wydziału Mechanicznego) i imię i nazwisko tylko, jeśli są w tekście.
- keywords: 5–8 słów kluczowych przydatnych do wyszukiwania podobnych rozwiązań.
- missing: lista informacji, których brakuje do rzetelnej oceny (np. koszt wdrożenia, liczba odbiorców, zmierzone efekty).`

export async function extractCard(text: string, url?: string | null): Promise<InnovationCard> {
  const input = url ? `Źródło: ${url}\n\n${text.slice(0, 24000)}` : text.slice(0, 24000)
  const card = await structured(innovationCardSchema, "innovation_card", INSTRUCTIONS, input)
  const trl = card.maturity.value.trl
  return {
    ...card,
    maturity: {
      ...card.maturity,
      value: {
        ...card.maturity.value,
        trl: card.innovationType === "technologiczna" && trl ? Math.min(9, Math.max(1, trl)) : null,
      },
    },
  }
}

export function cardEmbeddingText(card: InnovationCard): string {
  return [card.title, card.summary, card.problem.value, card.solution.value, card.domain, card.keywords.join(", ")]
    .filter(Boolean)
    .join("\n")
}

const QUOTED_FIELDS = ["problem", "solution", "beneficiaries", "maturity", "results", "costs"] as const

export function cardCompleteness(card: InnovationCard): number {
  const present = QUOTED_FIELDS.filter((f) => card[f].quote).length
  return present / QUOTED_FIELDS.length
}
