import { config } from "dotenv"
config({ path: ".env.local" })

import { readFile } from "node:fs/promises"
import { eq } from "drizzle-orm"
import type { InstitutionType } from "@/lib/card"
import type { PartnerKind } from "@/lib/domain"
import { embed } from "@/server/ai/client"
import { db } from "@/server/db"
import { innovation, institution, partner, source } from "@/server/db/schema"
import { analyzeInnovation, promoteDocument, storeDocument } from "@/server/pipeline/ingest"

type SeedInnovation = {
  title: string
  institution: string
  institutionType: InstitutionType
  city?: string | null
  url: string
  publishedAt?: string | null
  innovationType?: string
  text: string
  demo?: boolean
}

type SeedPartner = {
  name: string
  kind: PartnerKind
  region?: string | null
  description: string
  tags: string[]
  url?: string | null
}

type SeedSource = {
  name: string
  url: string
  institution: string
  institutionType: InstitutionType
  city?: string | null
  region?: string | null
  articlePattern?: string
}

type SeedFile = { innovations?: SeedInnovation[]; partners?: SeedPartner[]; sources?: SeedSource[] }

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith("--")) ?? "seed/seed.json"
const withDemo = args.includes("--with-demo")

async function upsertInstitution(name: string, type: InstitutionType, city?: string | null, region = "podkarpackie") {
  const [row] = await db()
    .insert(institution)
    .values({ name, type, city: city ?? null, region })
    .onConflictDoUpdate({ target: institution.name, set: { type } })
    .returning({ id: institution.id })
  return row.id
}

async function seedPartners(partners: SeedPartner[]) {
  const existing = new Set((await db().select({ name: partner.name }).from(partner)).map((p) => p.name))
  const fresh = partners.filter((p) => !existing.has(p.name))
  for (let i = 0; i < fresh.length; i += 50) {
    const batch = fresh.slice(i, i + 50)
    const vectors = await embed(batch.map((p) => [p.name, p.description, p.tags.join(", ")].join("\n")))
    await db()
      .insert(partner)
      .values(
        batch.map((p, j) => ({
          name: p.name,
          kind: p.kind,
          region: p.region ?? null,
          description: p.description,
          tags: p.tags,
          url: p.url ?? null,
          embedding: vectors?.[j] ?? null,
        })),
      )
  }
  console.log(`partners: ${fresh.length} added, ${partners.length - fresh.length} already present`)
}

async function seedSources(sources: SeedSource[]) {
  for (const s of sources) {
    const [found] = await db().select({ id: source.id }).from(source).where(eq(source.url, s.url))
    if (found) continue
    const institutionId = await upsertInstitution(s.institution, s.institutionType, s.city, s.region ?? "podkarpackie")
    await db()
      .insert(source)
      .values({ kind: "www", name: s.name, url: s.url, institutionId, config: s.articlePattern ? { articlePattern: s.articlePattern } : null })
  }
  console.log(`sources: ${sources.length} checked`)
}

async function seedInnovations(items: SeedInnovation[]) {
  const [existingImport] = await db().select({ id: source.id }).from(source).where(eq(source.kind, "import"))
  const [importSource] = existingImport
    ? [existingImport]
    : await db().insert(source).values({ kind: "import", name: "Import danych startowych" }).returning({ id: source.id })

  const created: number[] = []
  for (const item of items) {
    try {
      const institutionId = await upsertInstitution(item.institution, item.institutionType, item.city)
      const doc = await storeDocument({
        text: item.title + "\n\n" + item.text,
        url: item.url,
        title: item.title,
        sourceId: importSource.id,
        institutionId,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      })
      const result = await promoteDocument(doc.id, { author: "import", note: "Dane startowe: " + item.url })
      if (!result.merged) created.push(result.id)
      console.log(result.merged ? "merged:" : "added:", item.title)
    } catch (error) {
      console.error("card failed:", item.title, error instanceof Error ? error.message : error)
    }
  }

  for (const id of created.slice(0, Math.max(0, created.length - 1))) {
    const [row] = await db().select({ title: innovation.title }).from(innovation).where(eq(innovation.id, id))
    try {
      const result = await analyzeInnovation(id)
      console.log(`re-analyzed with full base: ${row?.title} → potencjał ${result.potential}, wiarygodność ${result.credibility}, ${result.recommendation.primary}`)
    } catch (error) {
      console.error("analysis failed:", row?.title, error instanceof Error ? error.message : error)
    }
  }
}

async function main() {
  const data = JSON.parse(await readFile(file, "utf8")) as SeedFile
  if (data.partners?.length) await seedPartners(data.partners)
  if (data.sources?.length) await seedSources(data.sources)
  const innovations = (data.innovations ?? []).filter((i) => withDemo || !i.demo)
  if (innovations.length) await seedInnovations(innovations)
  const skipped = (data.innovations ?? []).filter((i) => i.demo && !withDemo)
  if (skipped.length) console.log("demo cases left out for live submission:", skipped.map((i) => i.title).join(" | "))
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
