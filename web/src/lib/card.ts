import { z } from "zod"

export const INNOVATION_AREAS = ["technologiczna", "edukacyjna", "administracyjna"] as const
export const INNOVATION_CHARACTERS = ["produkt", "usluga", "proces", "metoda", "organizacja"] as const
export const IMPLEMENTATION_LEVELS = ["koncepcja", "prototyp", "testy", "pilotaz", "stosowane"] as const
export const NOVELTY_SCOPES = ["instytucja", "polska", "swiat"] as const
export const TARGET_GROUPS = ["inwestorzy", "instytucje_publiczne", "uczelnie", "szkoly", "startupy", "innowatorzy"] as const
export const EVIDENCE_KINDS = [
  "patent",
  "zgloszenie_patentowe",
  "publikacja",
  "projekt_finansowany",
  "raport",
  "dane_z_wdrozenia",
  "nagroda",
  "media",
] as const
export const INSTITUTION_TYPES = ["gmina", "powiat", "wojewodztwo", "szkola", "uczelnia", "instytut", "firma", "inna"] as const

const fact = <T extends z.ZodType>(value: T) =>
  z.object({
    value,
    quote: z.string().nullable().describe("Dosłowny fragment źródła potwierdzający wartość; null, gdy wartość jest wnioskiem, a nie faktem ze źródła"),
  })

export const innovationCardSchema = z.object({
  title: z.string(),
  summary: z.string().describe("Dwa zdania: co to jest i jaki problem rozwiązuje"),
  institution: z.object({
    name: z.string(),
    type: z.enum(INSTITUTION_TYPES),
    location: z.string().nullable(),
  }),
  area: z.enum(INNOVATION_AREAS),
  character: z.enum(INNOVATION_CHARACTERS),
  domain: z.string().describe("Dziedzina lub branża, np. budownictwo, medycyna, e-administracja, edukacja wczesnoszkolna"),
  problem: fact(z.string().nullable()),
  solution: fact(z.string().nullable()),
  users: fact(z.string().nullable()).describe("Kto korzysta z rozwiązania"),
  implementation: fact(
    z.object({
      level: z.enum(IMPLEMENTATION_LEVELS),
      since: z.string().nullable().describe("Od kiedy działa lub kiedy testowano, jeśli podano"),
    }),
  ),
  trl: fact(z.number().int().nullable().describe("TRL 1–9 tylko dla rozwiązań technologicznych")),
  novelty: fact(
    z.object({
      scope: z.enum(NOVELTY_SCOPES).nullable().describe("Nowość dla instytucji, w skali Polski albo światowa"),
      description: z.string().nullable().describe("Czym różni się od dotychczasowych rozwiązań"),
    }),
  ),
  results: fact(z.string().nullable()).describe("Zmierzone efekty, liczby"),
  ip: fact(z.string().nullable()).describe("Patent, zgłoszenie patentowe, wzór użytkowy (numer, jeśli podano)"),
  evidence: z.array(
    z.object({
      kind: z.enum(EVIDENCE_KINDS),
      description: z.string(),
      quote: z.string().nullable(),
    }),
  ),
  applications: z
    .array(z.object({ where: z.string(), why: z.string() }))
    .describe("Gdzie jeszcze można zastosować rozwiązanie (Twoja ocena, nie fakt ze źródła): 2–4 pozycje"),
  targetGroups: z.array(z.enum(TARGET_GROUPS)).describe("Dla których grup odbiorców rozwiązanie jest najciekawsze"),
  creators: z.array(z.object({ role: z.string(), name: z.string().nullable() })),
  keywords: z.array(z.string()),
  missing: z.array(z.string()).describe("Czego brakuje w źródle, by rzetelnie ocenić innowację"),
})

export type InnovationCardDraft = z.infer<typeof innovationCardSchema>

export const FACT_FIELDS = ["problem", "solution", "users", "implementation", "trl", "novelty", "results", "ip"] as const
export type FactField = (typeof FACT_FIELDS)[number]
export type FactStatus = "potwierdzone" | "szacunek" | "brak"

export type InnovationCard = InnovationCardDraft & {
  verification: Record<FactField, FactStatus>
  evidenceVerified: boolean[]
}

export type InnovationArea = (typeof INNOVATION_AREAS)[number]
export type InnovationCharacter = (typeof INNOVATION_CHARACTERS)[number]
export type ImplementationLevel = (typeof IMPLEMENTATION_LEVELS)[number]
export type TargetGroup = (typeof TARGET_GROUPS)[number]
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]
export type InstitutionType = (typeof INSTITUTION_TYPES)[number]
