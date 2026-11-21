import "server-only"
import { z } from "zod"
import type { DetectionResult } from "@/lib/domain"
import { structured } from "@/server/ai/client"

const detectionSchema = z.object({
  isInnovation: z.boolean(),
  score: z.number().describe("Pewność od 0 do 1"),
  reason: z.string().describe("Jedno zdanie uzasadnienia po polsku"),
})

const INSTRUCTIONS = `Jesteś analitykiem Podkarpackiego Centrum Innowacji. Oceniasz, czy tekst opublikowany przez szkołę, uczelnię, samorząd lub inną instytucję publiczną opisuje innowację.

Innowacja to konkretne rozwiązanie (technologiczne, organizacyjne, edukacyjne, społeczne albo procesowe), które instytucja stworzyła, testuje lub wdrożyła i które rozwiązuje realny problem. Może to być nowa usługa, aplikacja, sposób organizacji pracy, program nauczania, urządzenie, wynik badań.

To NIE jest innowacja: ogłoszenie o przetargu, naborze lub wydarzeniu bez opisu rozwiązania, relacja z uroczystości, zakup gotowego sprzętu bez nowego zastosowania, ogólna deklaracja planów.

Zwróć isInnovation, pewność 0–1 i jedno zdanie uzasadnienia.`

export async function detectInnovation(text: string): Promise<DetectionResult> {
  const result = await structured(detectionSchema, "detection", INSTRUCTIONS, text.slice(0, 12000))
  return { ...result, score: Math.min(1, Math.max(0, result.score)) }
}
