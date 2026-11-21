export const INNOVATION_STATUSES = [
  "wykryta",
  "zweryfikowana",
  "oceniona",
  "rekomendowana",
  "w_kontakcie",
  "pilotaz",
  "wdrozona",
  "odrzucona",
] as const
export type InnovationStatus = (typeof INNOVATION_STATUSES)[number]

export const SOURCE_KINDS = ["zgloszenie", "www", "ncbr", "interreg", "pbn", "uprp", "epo"] as const
export type SourceKind = (typeof SOURCE_KINDS)[number]

export const DOCUMENT_STATUSES = ["nowy", "kandydat", "odrzucony", "wyodrebniony"] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const PARTNER_KINDS = ["jst", "szkola", "uczelnia", "firma", "inwestor", "program", "ctt", "akcelerator", "ngo"] as const
export type PartnerKind = (typeof PARTNER_KINDS)[number]

export const PATHWAYS = ["transfer", "komercjalizacja", "prototypowanie", "finansowanie", "pilotaz", "uzupelnienie"] as const
export type Pathway = (typeof PATHWAYS)[number]

export const DUPLICATE_THRESHOLD = 0.88
export const SIMILAR_THRESHOLD = 0.75
export const DETECTION_THRESHOLD = 0.5

export const CRITERIA = ["waga_problemu", "nowosc", "dojrzalosc", "efekty", "przenaszalnosc", "koszt"] as const
export type Criterion = (typeof CRITERIA)[number]

export const MATCH_STATUSES = ["zaproponowane", "wyslane", "zainteresowany", "odrzucone"] as const
export type MatchStatus = (typeof MATCH_STATUSES)[number]

export const PRIOR_ART_SOURCES = ["iskra", "uprp", "epo", "pbn", "ncbr", "interreg"] as const
export type PriorArtSource = (typeof PRIOR_ART_SOURCES)[number]

export type PathwayRecommendation = {
  primary: Pathway
  secondary: Pathway[]
  reasons: string[]
  nextSteps: string[]
}

export type DetectionResult = {
  isInnovation: boolean
  score: number
  reason: string
}
