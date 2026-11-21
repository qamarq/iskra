import { config } from "dotenv"
config({ path: ".env.local" })

import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { document, innovation, source } from "@/server/db/schema"
import { detectInnovation } from "@/server/pipeline/detect"
import { setStatus } from "@/server/pipeline/status"

async function main() {
  const rows = await db()
    .select({ id: innovation.id, title: innovation.title, docId: document.id, text: document.text })
    .from(innovation)
    .innerJoin(document, eq(innovation.documentId, document.id))
    .innerJoin(source, eq(document.sourceId, source.id))
    .where(eq(source.kind, "import"))
  for (const row of rows) {
    const detection = await detectInnovation(row.text)
    await db().update(document).set({ detection }).where(eq(document.id, row.docId))
    if (!detection.isInnovation || detection.score < 0.5) {
      await setStatus(row.id, "odrzucona", { author: "radar", note: "Nie spełnia definicji innowacji: " + detection.reason })
      console.log("rejected:", row.title, "·", detection.reason)
    } else {
      console.log("ok:", row.title, detection.score.toFixed(2))
    }
  }
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
