import { z } from "zod"
import { analyzeSource } from "@/server/pipeline/ingest"

const bodySchema = z.object({ url: z.url() })

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Podaj poprawny adres strony" }, { status: 400 })
  try {
    return Response.json(await analyzeSource({ url: parsed.data.url }))
  } catch (error) {
    console.error("source analysis failed", error)
    return Response.json({ error: error instanceof Error ? error.message : "Nie udało się przeanalizować źródła" }, { status: 500 })
  }
}
