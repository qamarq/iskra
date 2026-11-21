import { FACT_FIELDS, type FactStatus, type InnovationCard, type InnovationCardDraft } from "@/lib/card"

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[„”"'«»‘’`]/g, "")
    .replace(/[–—-]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
}

export function quoteInSource(quote: string | null | undefined, source: string): boolean {
  if (!quote) return false
  const q = normalize(quote).replace(/^\.+|\.+$/g, "").replace(/…/g, "")
  if (q.length < 8) return false
  const s = normalize(source)
  if (s.includes(q)) return true
  const words = q.split(" ")
  if (words.length < 6) return false
  const chunks: string[] = []
  for (let i = 0; i + 5 <= words.length; i += 5) chunks.push(words.slice(i, i + 5).join(" "))
  const found = chunks.filter((c) => s.includes(c)).length
  return found / chunks.length >= 0.7
}

function hasValue(field: (typeof FACT_FIELDS)[number], card: InnovationCardDraft): boolean {
  const v = card[field].value
  if (v == null) return false
  if (field === "novelty") return card.novelty.value.scope != null || card.novelty.value.description != null
  return true
}

export function verifyCard(card: InnovationCardDraft, sourceText: string): InnovationCard {
  const verification = Object.fromEntries(
    FACT_FIELDS.map((f) => {
      const status: FactStatus = !hasValue(f, card) ? "brak" : quoteInSource(card[f].quote, sourceText) ? "potwierdzone" : "szacunek"
      return [f, status]
    }),
  ) as Record<(typeof FACT_FIELDS)[number], FactStatus>
  return {
    ...card,
    verification,
    evidenceVerified: card.evidence.map((e) => quoteInSource(e.quote, sourceText)),
  }
}
