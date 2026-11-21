import { config } from "dotenv"
config({ path: ".env.local" })

import { readFile } from "node:fs/promises"
import { inArray } from "drizzle-orm"
import { db } from "@/server/db"
import { document, innovation } from "@/server/db/schema"

async function main() {
  const seed = JSON.parse(await readFile("seed/seed.json", "utf8")) as { innovations: { url: string; demo?: boolean }[] }
  const urls = seed.innovations.filter((i) => i.demo).map((i) => i.url)
  const docs = await db().select({ id: document.id, innovationId: document.innovationId }).from(document).where(inArray(document.url, urls))
  const ids = docs.map((d) => d.innovationId).filter((id): id is number => id != null)
  if (ids.length) await db().delete(innovation).where(inArray(innovation.id, ids))
  if (docs.length) await db().delete(document).where(inArray(document.id, docs.map((d) => d.id)))
  console.log(`demo reset: removed ${ids.length} innovations and ${docs.length} documents`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
