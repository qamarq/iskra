import type { EvidenceKind, InnovationCard } from "@/lib/card"
import type { Credibility, CredibilityPart, SourceKind } from "@/lib/domain"

const KEY_FACTS = ["problem", "solution", "implementation", "results", "novelty", "ip", "trl"] as const
const STRONG: EvidenceKind[] = ["patent", "zgloszenie_patentowe", "publikacja", "projekt_finansowany", "raport", "dane_z_wdrozenia"]

const SOURCE_WEIGHT: Record<SourceKind, number> = {
  uprp: 1,
  epo: 1,
  cordis: 1,
  ncbr: 1,
  pbn: 1,
  openalex: 0.9,
  www: 0.7,
  import: 0.7,
  analiza: 0.6,
}

export function computeCredibility(card: InnovationCard, sourceKinds: SourceKind[]): Credibility {
  const present = KEY_FACTS.filter((f) => card.verification[f] !== "brak")
  const confirmed = present.filter((f) => card.verification[f] === "potwierdzone")
  const quoteShare = present.length ? confirmed.length / present.length : 0

  const sourceValue = sourceKinds.length ? Math.max(...sourceKinds.map((k) => SOURCE_WEIGHT[k] ?? 0.5)) : 0.5

  const evidencePoints = card.evidence.reduce((sum, e, i) => {
    const base = STRONG.includes(e.kind) ? 1 : 0.5
    return sum + (card.evidenceVerified[i] ? base : base / 2)
  }, 0)
  const evidenceValue = Math.min(1, evidencePoints / 2)

  const sourcesValue = Math.min(1, Math.max(0, sourceKinds.length - 1) / 2)

  const parts: CredibilityPart[] = [
    { id: "cytaty", label: "Fakty potwierdzone cytatem", weight: 0.4, value: quoteShare, detail: `${confirmed.length} z ${present.length} kluczowych informacji ma cytat znaleziony w źródle` },
    { id: "zrodlo", label: "Rodzaj źródła", weight: 0.25, value: sourceValue, detail: sourceKinds.join(", ") || "nieznane" },
    { id: "dowody", label: "Dokumentacja i potwierdzenia", weight: 0.2, value: evidenceValue, detail: card.evidence.length ? card.evidence.map((e) => e.kind.replace(/_/g, " ")).join(", ") : "brak" },
    { id: "zrodla", label: "Niezależne źródła", weight: 0.15, value: sourcesValue, detail: `${sourceKinds.length} ${sourceKinds.length === 1 ? "źródło" : "źródła"}` },
  ]
  const score = Math.round(parts.reduce((s, p) => s + p.weight * p.value, 0) * 100)
  return { score, parts }
}
