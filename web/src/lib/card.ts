import { z } from "zod"

export const INNOVATION_TYPES = ["technologiczna", "organizacyjna", "edukacyjna", "spoleczna", "procesowa"] as const
export const MATURITY_STAGES = ["pomysl", "prototyp", "pilotaz", "wdrozone", "efekty_zmierzone"] as const
export const INSTITUTION_TYPES = ["gmina", "powiat", "wojewodztwo", "szkola", "uczelnia", "instytut", "inna"] as const

const quoted = <T extends z.ZodType>(value: T) =>
  z.object({
    value,
    quote: z.string().nullable().describe("Dosłowny cytat ze źródła potwierdzający wartość albo null, gdy brak w źródle"),
  })

export const innovationCardSchema = z.object({
  title: z.string(),
  summary: z.string().describe("Dwa zdania: jaki problem i jak go rozwiązano"),
  institution: z.object({
    name: z.string(),
    type: z.enum(INSTITUTION_TYPES),
    location: z.string().nullable(),
  }),
  innovationType: z.enum(INNOVATION_TYPES),
  domain: z.string().describe("Dziedzina, np. edukacja, energetyka, zdrowie, administracja"),
  problem: quoted(z.string().nullable()),
  solution: quoted(z.string().nullable()),
  beneficiaries: quoted(z.string().nullable()),
  maturity: quoted(
    z.object({
      stage: z.enum(MATURITY_STAGES),
      trl: z.number().int().min(1).max(9).nullable(),
    }),
  ),
  results: quoted(z.string().nullable()),
  costs: quoted(z.string().nullable()),
  creators: z.array(z.object({ role: z.string(), name: z.string().nullable() })),
  keywords: z.array(z.string()),
  missing: z.array(z.string()).describe("Czego brakuje w źródle, by rzetelnie ocenić innowację"),
})

export type InnovationCard = z.infer<typeof innovationCardSchema>
export type InnovationType = (typeof INNOVATION_TYPES)[number]
export type MaturityStage = (typeof MATURITY_STAGES)[number]
export type InstitutionType = (typeof INSTITUTION_TYPES)[number]
