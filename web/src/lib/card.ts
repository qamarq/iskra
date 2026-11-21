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

export type InnovationCardDraft = z.infer<typeof innovationCardSchema> & { englishQuery?: string }

const q = (what: string) => z.string().describe("Dosłowny fragment źródła potwierdzający " + what + "; pusty tekst, gdy to Twój wniosek albo źródło o tym nie mówi")

export const extractionSchema = z.object({
  title: z.string(),
  summary: z.string().describe("Dwa zdania: co to jest i jaki problem rozwiązuje"),
  institution_name: z.string(),
  institution_type: z.enum(INSTITUTION_TYPES),
  institution_location: z.string().describe("Miejscowość; pusty tekst, gdy brak"),
  area: z.enum(INNOVATION_AREAS),
  character: z.enum(INNOVATION_CHARACTERS),
  domain: z.string(),
  problem: z.string().describe("Pusty tekst, gdy brak"),
  problem_quote: q("problem"),
  solution: z.string().describe("Pusty tekst, gdy brak"),
  solution_quote: q("rozwiązanie"),
  users: z.string().describe("Kto korzysta; pusty tekst, gdy brak"),
  users_quote: q("użytkowników"),
  level: z.enum(IMPLEMENTATION_LEVELS),
  level_since: z.string().describe("Od kiedy działa lub kiedy testowano; pusty tekst, gdy brak"),
  level_quote: q("etap wdrożenia"),
  trl: z.number().int().describe("TRL 1–9 tylko dla rozwiązań technologicznych; 0, gdy nie dotyczy lub nie da się określić"),
  trl_quote: q("poziom gotowości"),
  novelty_scope: z.enum([...NOVELTY_SCOPES, "nieznana"]),
  novelty_description: z.string().describe("Czym różni się od dotychczasowych rozwiązań; pusty tekst, gdy brak"),
  novelty_quote: q("nowość"),
  results: z.string().describe("Zmierzone efekty; pusty tekst, gdy brak"),
  results_quote: q("efekty"),
  ip: z.string().describe("Patent, zgłoszenie, wzór użytkowy z numerem; pusty tekst, gdy brak"),
  ip_quote: q("ochronę"),
  evidence: z.array(z.object({ kind: z.enum(EVIDENCE_KINDS), description: z.string(), quote: z.string() })),
  applications: z.array(z.object({ where: z.string(), why: z.string() })).describe("2–4 miejsca, gdzie jeszcze można zastosować rozwiązanie (Twoja ocena)"),
  target_groups: z.array(z.enum(TARGET_GROUPS)),
  creators: z.array(z.object({ role: z.string(), name: z.string().describe("Pusty tekst, gdy brak nazwiska") })),
  keywords: z.array(z.string()),
  english_query: z.string().describe("Krótkie zapytanie po angielsku (3–6 słów) do wyszukania publikacji naukowych o tym rozwiązaniu"),
  missing: z.array(z.string()),
})

export type Extraction = z.infer<typeof extractionSchema>

export function draftFromExtraction(e: Extraction): InnovationCardDraft {
  const t = (s: string) => (s.trim() ? s.trim() : null)
  return {
    title: e.title,
    summary: e.summary,
    institution: { name: e.institution_name, type: e.institution_type, location: t(e.institution_location) },
    area: e.area,
    character: e.character,
    domain: e.domain,
    problem: { value: t(e.problem), quote: t(e.problem_quote) },
    solution: { value: t(e.solution), quote: t(e.solution_quote) },
    users: { value: t(e.users), quote: t(e.users_quote) },
    implementation: { value: { level: e.level, since: t(e.level_since) }, quote: t(e.level_quote) },
    trl: { value: e.trl > 0 ? e.trl : null, quote: t(e.trl_quote) },
    novelty: { value: { scope: e.novelty_scope === "nieznana" ? null : e.novelty_scope, description: t(e.novelty_description) }, quote: t(e.novelty_quote) },
    results: { value: t(e.results), quote: t(e.results_quote) },
    ip: { value: t(e.ip), quote: t(e.ip_quote) },
    evidence: e.evidence.map((x) => ({ kind: x.kind, description: x.description, quote: t(x.quote) })),
    applications: e.applications,
    targetGroups: e.target_groups,
    creators: e.creators.map((c) => ({ role: c.role, name: t(c.name) })),
    keywords: e.keywords,
    missing: e.missing,
    englishQuery: e.english_query.trim() || undefined,
  }
}

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
