import "server-only"
import { z } from "zod"
import type { DetectionResult } from "@/lib/domain"
import { structured } from "@/server/ai/client"

const detectionSchema = z.object({
  isInnovation: z.boolean(),
  score: z.number().describe("Pewność od 0 do 1"),
  reason: z.string().describe("Jedno zdanie uzasadnienia po polsku"),
})

export const OSLO_DEFINITION = `Definicja innowacji (OECD/Eurostat, Oslo Manual 2018): nowe lub ulepszone rozwiązanie (produkt, usługa, proces, metoda albo sposób organizacji), które znacząco różni się od dotychczasowych i zostało udostępnione użytkownikom lub wdrożone w praktyce. Interesują nas trzy obszary: technologiczny (technologie, produkty, wynalazki, rozwiązania techniczne), edukacyjny (metody nauczania, narzędzia edukacyjne, rozwiązania wspierające szkoły i uczelnie) i administracyjny (usprawnienia administracji publicznej, samorządów i instytucji publicznych).`

const INSTRUCTIONS = `Jesteś analitykiem radaru innowacji. Oceniasz, czy tekst opisuje konkretną, istniejącą innowację powstałą lub wdrożoną w Polsce.

${OSLO_DEFINITION}

Uznaj za innowację także rozwiązania na etapie prototypu, testów lub pilotażu, jeśli tekst konkretnie opisuje, czym są i jak działają (np. wynalazek z patentem, prototyp nagrodzony w konkursie, pilotaż nowej usługi w urzędzie).

To NIE jest innowacja: relacja z wydarzenia, konferencji lub uroczystości, ranking, nagroda dla osoby bez opisu rozwiązania, ogłoszenie naboru, konkursu lub przetargu, zakup gotowego sprzętu bez nowego zastosowania, ogólne plany i deklaracje, informacje organizacyjne.

Zwróć isInnovation, pewność 0–1 i jedno zdanie uzasadnienia.`

export async function detectInnovation(text: string): Promise<DetectionResult> {
  const result = await structured(detectionSchema, "detection", INSTRUCTIONS, text.slice(0, 12000), { tier: "detect" })
  return { ...result, score: Math.min(1, Math.max(0, result.score)) }
}
