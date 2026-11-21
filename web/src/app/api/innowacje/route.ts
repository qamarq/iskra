import { IMPLEMENTATION_LEVELS, INNOVATION_AREAS, TARGET_GROUPS, type ImplementationLevel, type InnovationArea, type TargetGroup } from "@/lib/card"
import { getInnovationsBySlugs, searchInnovations } from "@/server/queries"

function pick<T extends string>(list: readonly T[], v: string | null): T | undefined {
  return v && (list as readonly string[]).includes(v) ? (v as T) : undefined
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const { rows, mode } = await searchInnovations(
    {
      q: params.get("q")?.trim() || undefined,
      area: pick<InnovationArea>(INNOVATION_AREAS, params.get("obszar")),
      level: pick<ImplementationLevel>(IMPLEMENTATION_LEVELS, params.get("etap")),
      group: pick<TargetGroup>(TARGET_GROUPS, params.get("dla")),
    },
    { limit: Math.min(200, Number(params.get("limit") ?? 100)) },
  )
  const cards = await getInnovationsBySlugs(rows.map((r) => r.slug))
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const origin = forwardedHost ? (request.headers.get("x-forwarded-proto") ?? "https") + "://" + forwardedHost : new URL(request.url).origin
  return Response.json({
    mode,
    count: cards.length,
    items: cards.map((c) => ({
      url: origin + "/innowacje/" + c.slug,
      title: c.title,
      institution: c.institution,
      area: c.area,
      character: c.character,
      level: c.level,
      trl: c.trl,
      region: c.region,
      potential: c.potential,
      credibility: c.credibility,
      credibilityDetail: c.credibilityDetail,
      recommendation: c.recommendation,
      status: c.status,
      checkedAt: c.checkedAt,
      match: rows.find((r) => r.slug === c.slug)?.match ?? null,
      card: c.card,
    })),
  })
}
