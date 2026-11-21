import "server-only"
import type { InnovationCard } from "@/lib/card"
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

export async function searchPublications(card: InnovationCard, limit = 3): Promise<Publication[]> {
  const query = card.keywords.slice(0, 5).join(" ")
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
