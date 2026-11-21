import { config } from "dotenv"
config({ path: ".env.local" })

import { isNotNull } from "drizzle-orm"
import { db } from "@/server/db"
import { source } from "@/server/db/schema"
import { recheckInnovations } from "@/server/pipeline/ingest"
import { crawlSource, screenPending } from "@/server/sources/crawl"

const args = process.argv.slice(2)
const flag = (name: string) => args.find((a) => a.startsWith("--" + name + "="))?.split("=").slice(1).join("=")
const limit = Number(flag("limit") ?? 15)
const match = flag("match")?.toLowerCase()
const hasModel = Boolean(process.env.OPENAI_API_KEY)
const screen = hasModel && !args.includes("--no-screen")

function print(r: { status: string; title?: string | null; url?: string; reason?: string }) {
  console.log(`  [${r.status}] ${r.title ?? r.url ?? ""}${r.reason ? " · " + r.reason : ""}`)
}

async function main() {
  if (args.includes("--screen-pending")) {
    if (!hasModel) throw new Error("OPENAI_API_KEY is not set")
    for (const r of await screenPending(Number(flag("limit") ?? 100))) print(r)
    process.exit(0)
  }
  if (args.includes("--recheck")) {
    for (const r of await recheckInnovations({ olderThanDays: Number(flag("days") ?? 7), limit })) print(r)
    process.exit(0)
  }
  if (!screen) console.log("Bez klucza API: strony są tylko pobierane (status: nowy). Później: pnpm crawl --screen-pending")
  const sources = (await db().select().from(source).where(isNotNull(source.url))).filter((s) => !match || s.name.toLowerCase().includes(match))
  for (const s of sources) {
    console.log(`\n== ${s.name} (${s.url})`)
    try {
      for (const r of await crawlSource(s.id, { limit, screen })) print(r)
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
