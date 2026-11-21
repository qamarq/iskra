import "server-only"
import { z } from "zod"
import type { InnovationCard } from "@/lib/card"
import { structured } from "@/server/ai/client"
import { USER_AGENT } from "./fetch-page"

export type Publication = { id: string; title: string; year: number | null; url: string; venue: string | null; relevance: number }

type OpenAlexWork = {
  id: string
  title: string | null
  publication_year: number | null
  doi: string | null
  relevance_score: number | null
  primary_location?: { source?: { display_name?: string | null } | null } | null
}

const querySchema = z.object({ query: z.string().describe("3–6 English words") })

async function englishQuery(card: InnovationCard): Promise<string> {
  if (card.englishQuery) return card.englishQuery
  const result = await structured(
    querySchema,
    "publication_query",
    "Write a short English search query (3–6 words) to find scientific publications about the described solution.",
    [card.title, card.summary, card.keywords.join(", ")].join("\n"),
    { tier: "detect" },
  )
  return result.query
}

export async function searchPublications(card: InnovationCard, limit = 3): Promise<Publication[]> {
  const query = await englishQuery(card)
  if (!query) return []
  const params = new URLSearchParams({
    search: query,
    "per-page": String(limit),
    select: "id,title,publication_year,doi,relevance_score,primary_location",
  })
  const response = await fetch("https://api.openalex.org/works?" + params.toString(), {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) return []
  const body = (await response.json()) as { results?: OpenAlexWork[] }
  return (body.results ?? [])
    .filter((w) => w.title)
    .map((w) => ({
      id: w.id,
      title: w.title as string,
      year: w.publication_year,
      url: w.doi ?? w.id,
      venue: w.primary_location?.source?.display_name ?? null,
      relevance: w.relevance_score ?? 0,
    }))
}
