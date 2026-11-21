import { z } from "zod"
import { submit } from "@/server/pipeline/ingest"

const bodySchema = z
  .object({
    text: z.string().max(60000).optional(),
    url: z.url().optional(),
  })
  .refine((b) => (b.text && b.text.trim().length > 0) || b.url, { message: "Podaj opis albo link" })

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" }, { status: 400 })
  }
  try {
    const result = await submit(parsed.data)
    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error("submission failed", error)
    const message = error instanceof Error ? error.message : "Nie udało się przetworzyć zgłoszenia"
    return Response.json({ error: message }, { status: 500 })
  }
}
