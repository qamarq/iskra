import { config } from "dotenv"
config({ path: ".env.local" })

import { and, eq, isNull } from "drizzle-orm"
import { SIMILAR_THRESHOLD } from "@/lib/domain"
import { embed } from "@/server/ai/client"
import { db } from "@/server/db"
import { innovation, partner, priorArt } from "@/server/db/schema"
import { cardEmbeddingText } from "@/server/pipeline/extract"
import { analyzeInnovation } from "@/server/pipeline/ingest"
import { findSimilarInnovations } from "@/server/pipeline/similar"

async function main() {
  const partners = await db().select().from(partner).where(isNull(partner.embedding))
  for (let i = 0; i < partners.length; i += 50) {
    const batch = partners.slice(i, i + 50)
    const vectors = await embed(batch.map((p) => [p.name, p.description, p.tags.join(", ")].join("\n")))
    if (!vectors) throw new Error("Embeddings are not configured (OPENAI_API_KEY)")
    for (const [j, p] of batch.entries()) await db().update(partner).set({ embedding: vectors[j] }).where(eq(partner.id, p.id))
  }
  console.log("partners embedded:", partners.length)

  const innovations = await db().select({ id: innovation.id, card: innovation.card }).from(innovation).where(isNull(innovation.embedding))
  for (const row of innovations) {
    const vectors = await embed([cardEmbeddingText(row.card)])
    if (vectors) await db().update(innovation).set({ embedding: vectors[0] }).where(eq(innovation.id, row.id))
  }
  console.log("innovations embedded:", innovations.length)

  if (process.argv.includes("--similar")) {
    const all = await db().select({ id: innovation.id, title: innovation.title, embedding: innovation.embedding }).from(innovation)
    for (const row of all) {
      if (!row.embedding) continue
      const similar = await findSimilarInnovations(row.embedding, { excludeId: row.id, limit: 5, minSimilarity: SIMILAR_THRESHOLD })
      await db().delete(priorArt).where(and(eq(priorArt.innovationId, row.id), eq(priorArt.source, "iskra")))
      if (similar.length) {
        await db()
          .insert(priorArt)
          .values(similar.map((s) => ({ innovationId: row.id, source: "iskra" as const, externalId: String(s.id), title: s.title, url: "/innowacje/" + s.slug, snippet: s.institution, similarity: s.similarity })))
      }
      if (similar.length) console.log(`similar: ${row.title} → ${similar.map((s) => s.title.slice(0, 40) + " " + s.similarity.toFixed(2)).join(" | ")}`)
    }
  }

  if (process.argv.includes("--reanalyze")) {
    const all = await db().select({ id: innovation.id, title: innovation.title }).from(innovation)
    for (const row of all) {
      try {
        const r = await analyzeInnovation(row.id)
        console.log(`reanalyzed: ${row.title} → potencjał ${r.potential}, wiarygodność ${r.credibility}, ${r.recommendation.primary}, podobne ${r.similar.length}`)
      } catch (error) {
        console.error("reanalysis failed:", row.title, error instanceof Error ? error.message : error)
      }
    }
  }
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
