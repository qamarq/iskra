export const INNOVATION_STATUSES = ["nowa", "zweryfikowana", "odrzucona"] as const
export type InnovationStatus = (typeof INNOVATION_STATUSES)[number]

export const EVENT_KINDS = ["dodana", "ocena", "nowe_zrodlo", "zweryfikowana", "odrzucona", "korekta_oceny", "aktualizacja"] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export const SOURCE_KINDS = ["analiza", "www", "cordis", "openalex", "ncbr", "uprp", "epo", "pbn", "import"] as const
export type SourceKind = (typeof SOURCE_KINDS)[number]

export const DOCUMENT_STATUSES = ["nowy", "kandydat", "odrzucony", "wyodrebniony"] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const PARTNER_KINDS = ["jst", "szkola", "uczelnia", "firma", "inwestor", "program", "ctt", "akcelerator", "ngo"] as const
export type PartnerKind = (typeof PARTNER_KINDS)[number]

export const RECOMMENDATIONS = ["wdrozenie", "licencja", "pilotaz", "rozwoj", "weryfikacja"] as const
export type Recommendation = (typeof RECOMMENDATIONS)[number]

export const CRITERIA = ["poziom_wdrozenia", "dojrzalosc_technologiczna", "innowacyjnosc", "potencjal_zastosowania"] as const
export type Criterion = (typeof CRITERIA)[number]

export const PRIOR_ART_SOURCES = ["iskra", "openalex", "cordis", "uprp", "epo", "pbn", "ncbr"] as const
export type PriorArtSource = (typeof PRIOR_ART_SOURCES)[number]

export const DUPLICATE_THRESHOLD = 0.9
export const SIMILAR_THRESHOLD = 0.75
export const DETECTION_THRESHOLD = 0.5
export const AUTO_PROMOTE_THRESHOLD = 0.75

export type RecommendationResult = {
  primary: Recommendation
  secondary: Recommendation[]
  reasons: string[]
  nextSteps: string[]
}

export type CredibilityPart = { id: "cytaty" | "zrodlo" | "dowody" | "zrodla"; label: string; weight: number; value: number; detail: string }
export type Credibility = { score: number; parts: CredibilityPart[] }

export type DetectionResult = {
  isInnovation: boolean
  score: number
  reason: string
}
