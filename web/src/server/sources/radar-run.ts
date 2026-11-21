import "server-only"
import { isNotNull } from "drizzle-orm"
import { db } from "@/server/db"
import { source } from "@/server/db/schema"
import { recheckInnovations } from "@/server/pipeline/ingest"
import { crawlSource, screenPending } from "./crawl"

export async function runRadar({ limit = 10, match }: { limit?: number; match?: string } = {}) {
  const sources = (await db().select().from(source).where(isNotNull(source.url))).filter((s) => !match || s.name.toLowerCase().includes(match.toLowerCase()))
  const report: { source: string; results: { status: string; title?: string | null }[]; error?: string }[] = []
  for (const s of sources) {
    try {
      report.push({ source: s.name, results: await crawlSource(s.id, { limit }) })
    } catch (error) {
      report.push({ source: s.name, results: [], error: error instanceof Error ? error.message : String(error) })
    }
  }
  const pending = await screenPending(50)
  const rechecked = await recheckInnovations({ olderThanDays: 7, limit: 20 })
  return { report, pending, rechecked }
}
