import "server-only"
import { innovationCardSchema, type InnovationCard } from "@/lib/card"
import { structured } from "@/server/ai/client"
import { OSLO_DEFINITION } from "./detect"
import { verifyCard } from "./verify"

const INSTRUCTIONS = `Jesteś analitykiem radaru innowacji. Z podanego tekstu tworzysz kartę innowacji po polsku.

${OSLO_DEFINITION}

Zasady:
- Rozróżniaj fakty od szacunków. Przy polach z cytatem (quote) wpisz dosłowny fragment tekstu, który potwierdza wartość (kopiuj znak w znak, bez zmian). Jeśli wartość jest Twoim wnioskiem, a nie faktem z tekstu, ustaw quote na null. Jeśli tekst nic o tym nie mówi, ustaw value na null.
- area: technologiczna, edukacyjna albo administracyjna (rozwiązania dla administracji publicznej, samorządów i instytucji publicznych).
- character: produkt, usluga, proces, metoda albo organizacja.
- implementation.level: koncepcja, prototyp, testy, pilotaz (wdrożenie pilotażowe) albo stosowane (działa w praktyce).
- trl: tylko dla rozwiązań technologicznych, gdy tekst pozwala go określić; inaczej null.
- novelty.scope: instytucja (nowe tylko dla tej instytucji), polska albo swiat; null, jeśli nie da się określić.
- ip: patent, zgłoszenie patentowe, wzór użytkowy (z numerem, jeśli jest).
- evidence: dowody wiarygodności wymienione w tekście (patent, publikacja, projekt finansowany z numerem lub nazwą programu, raport, dane z wdrożenia, nagroda, wzmianka w mediach), każdy z cytatem.
- applications: 2–4 miejsca, w których rozwiązanie mogłoby być zastosowane poza miejscem powstania (to Twoja ocena).
- targetGroups: inwestorzy, instytucje_publiczne, uczelnie, szkoly, startupy, innowatorzy.
- creators: rola i nazwisko tylko, jeśli są w tekście.
- keywords: 5–8 słów kluczowych przydatnych do wyszukiwania.
- missing: czego brakuje do rzetelnej oceny.`

export async function extractCard(text: string, url?: string | null): Promise<InnovationCard> {
  const source = text.slice(0, 24000)
  const input = url ? `Źródło: ${url}\n\n${source}` : source
  const draft = await structured(innovationCardSchema, "innovation_card", INSTRUCTIONS, input)
  const trl = draft.trl.value
  const normalized = {
    ...draft,
    trl: { ...draft.trl, value: draft.area === "technologiczna" && trl ? Math.min(9, Math.max(1, trl)) : null },
  }
  return verifyCard(normalized, source)
}

export function cardEmbeddingText(card: InnovationCard): string {
  return [card.title, card.summary, card.problem.value, card.solution.value, card.domain, card.keywords.join(", ")]
    .filter(Boolean)
    .join("\n")
}
