import { config } from "dotenv"
config({ path: ".env.local" })

import { isNotNull } from "drizzle-orm"
import { db } from "@/server/db"
import { source } from "@/server/db/schema"
import { crawlSource } from "@/server/sources/crawl"

const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 15)

async function main() {
  const sources = await db().select().from(source).where(isNotNull(source.url))
  for (const s of sources) {
    console.log(`\n== ${s.name} (${s.url})`)
    try {
      const results = await crawlSource(s.id, { limit })
      for (const r of results) console.log(`  [${r.status}] ${r.url}${r.reason ? " · " + r.reason : ""}`)
    } catch (error) {
      console.error("  source failed:", error instanceof Error ? error.message : error)
    }
  }
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
