import "server-only"
import { and, asc, count, cosineDistance, desc, eq, gte, ilike, inArray, isNotNull, ne, or, sql, type SQL } from "drizzle-orm"
import { IMPLEMENTATION_LEVELS, type ImplementationLevel, type InnovationArea, type TargetGroup } from "@/lib/card"
import type { Criterion, Recommendation } from "@/lib/domain"
import { embed } from "@/server/ai/client"
import { db } from "@/server/db"
import { document, evaluation, event, innovation, institution, match, partner, priorArt, searchLog, source, viewLog } from "@/server/db/schema"

export type SearchFilters = {
  q?: string
  area?: InnovationArea
  level?: ImplementationLevel
  group?: TargetGroup
  recommendation?: Recommendation
  region?: string
  includeRejected?: boolean
}

const listColumns = {
  id: innovation.id,
  slug: innovation.slug,
  title: innovation.title,
  summary: innovation.summary,
  area: innovation.area,
  character: innovation.character,
  level: innovation.level,
  trl: innovation.trl,
  region: innovation.region,
  status: innovation.status,
  potential: innovation.potential,
  credibility: innovation.credibility,
  recommendation: innovation.recommendation,
  checkedAt: innovation.checkedAt,
  institution: institution.name,
  institutionType: institution.type,
}

export async function searchInnovations(filters: SearchFilters = {}, { log = false, limit = 60 } = {}) {
  const conditions: (SQL | undefined)[] = [
    filters.includeRejected ? undefined : ne(innovation.status, "odrzucona"),
    filters.area ? eq(innovation.area, filters.area) : undefined,
    filters.level ? eq(innovation.level, filters.level) : undefined,
    filters.region ? eq(innovation.region, filters.region) : undefined,
    filters.group ? sql`${innovation.card}->'targetGroups' ? ${filters.group}` : undefined,
    filters.recommendation ? sql`${innovation.recommendation}->>'primary' = ${filters.recommendation}` : undefined,
  ]

  let mode: "semantic" | "text" | "none" = "none"
  let rows: (Awaited<ReturnType<typeof baseQuery>>[number] & { match: number | null })[] = []

  function baseQuery(extra: (SQL | undefined)[] = []) {
    return db()
      .select(listColumns)
      .from(innovation)
      .leftJoin(institution, eq(innovation.institutionId, institution.id))
      .where(and(...conditions, ...extra))
  }

  if (filters.q) {
    try {
      const vector = (await embed([filters.q]))?.[0]
      if (!vector) throw new Error("embeddings disabled")
      const distance = cosineDistance(innovation.embedding, vector)
      const semantic = await db()
        .select({ ...listColumns, match: sql<number>`1 - (${distance})` })
        .from(innovation)
        .leftJoin(institution, eq(innovation.institutionId, institution.id))
        .where(and(...conditions, isNotNull(innovation.embedding)))
        .orderBy(distance)
        .limit(limit)
      const scored = semantic.map((r) => ({ ...r, match: Number(r.match) }))
      const best = scored[0]?.match ?? 0
      rows = scored.filter((r) => r.match >= Math.max(0.3, best - 0.15))
      mode = "semantic"
    } catch {
      const like = `%${filters.q}%`
      const text = await baseQuery([or(ilike(innovation.title, like), ilike(innovation.summary, like), ilike(institution.name, like), sql`${innovation.card}::text ilike ${like}`)])
        .orderBy(sql`${innovation.potential} desc nulls last`)
        .limit(limit)
      rows = text.map((r) => ({ ...r, match: null }))
      mode = "text"
    }
  } else {
    const all = await baseQuery().orderBy(sql`${innovation.potential} desc nulls last`, desc(innovation.createdAt)).limit(limit)
    rows = all.map((r) => ({ ...r, match: null }))
  }

  if (log && (filters.q || filters.area || filters.group || filters.level)) {
    const loggedFilters = Object.fromEntries(Object.entries({ area: filters.area, level: filters.level, group: filters.group, region: filters.region }).filter(([, v]) => v)) as Record<string, string>
    await db().insert(searchLog).values({ query: filters.q?.slice(0, 200) ?? null, filters: loggedFilters, results: rows.length }).catch(() => undefined)
  }
  return { rows, mode }
}

export type InnovationListItem = Awaited<ReturnType<typeof searchInnovations>>["rows"][number]

export async function getInnovation(slug: string) {
  const [row] = await db()
    .select({ innovation, institution })
    .from(innovation)
    .leftJoin(institution, eq(innovation.institutionId, institution.id))
    .where(eq(innovation.slug, slug))
  if (!row) return null
  const id = row.innovation.id

  const [evaluations, priorArtRows, matches, events, documents] = await Promise.all([
    db().selectDistinctOn([evaluation.criterion]).from(evaluation).where(eq(evaluation.innovationId, id)).orderBy(evaluation.criterion, desc(evaluation.createdAt)),
    db().select().from(priorArt).where(eq(priorArt.innovationId, id)).orderBy(desc(priorArt.similarity)),
    db()
      .select({ match, partner: { id: partner.id, name: partner.name, kind: partner.kind, url: partner.url } })
      .from(match)
      .innerJoin(partner, eq(match.partnerId, partner.id))
      .where(eq(match.innovationId, id))
      .orderBy(desc(match.score)),
    db().select().from(event).where(eq(event.innovationId, id)).orderBy(asc(event.at)),
    db()
      .select({ id: document.id, url: document.url, title: document.title, fetchedAt: document.fetchedAt, sourceKind: source.kind, sourceName: source.name })
      .from(document)
      .leftJoin(source, eq(document.sourceId, source.id))
      .where(eq(document.innovationId, id))
      .orderBy(asc(document.fetchedAt)),
  ])

  const { embedding: _embedding, ...rest } = row.innovation
  void _embedding
  return {
    ...rest,
    institution: row.institution,
    evaluations: Object.fromEntries(evaluations.map((e) => [e.criterion, e])) as Partial<Record<Criterion, (typeof evaluations)[number]>>,
    priorArt: priorArtRows,
    matches,
    events,
    documents,
  }
}

export type InnovationDetail = NonNullable<Awaited<ReturnType<typeof getInnovation>>>

export async function recordView(innovationId: number) {
  await db().insert(viewLog).values({ innovationId }).catch(() => undefined)
}

export async function getInnovationsBySlugs(slugs: string[]) {
  if (!slugs.length) return []
  const rows = await db()
    .select({ ...listColumns, card: innovation.card, credibilityDetail: innovation.credibilityDetail })
    .from(innovation)
    .leftJoin(institution, eq(innovation.institutionId, institution.id))
    .where(inArray(innovation.slug, slugs))
  return slugs.map((s) => rows.find((r) => r.slug === s)).filter((r) => r != null)
}

export async function listCandidates() {
  return db()
    .select({
      id: document.id,
      title: document.title,
      url: document.url,
      text: sql<string>`left(${document.text}, 600)`,
      detection: document.detection,
      fetchedAt: document.fetchedAt,
      sourceName: source.name,
      sourceKind: source.kind,
    })
    .from(document)
    .leftJoin(source, eq(document.sourceId, source.id))
    .where(eq(document.status, "kandydat"))
    .orderBy(sql`(${document.detection}->>'score')::float desc`, desc(document.fetchedAt))
}

export async function listPendingDocuments(limit = 100) {
  const [rows, [total]] = await Promise.all([
    db()
      .select({ id: document.id, title: document.title, url: document.url, fetchedAt: document.fetchedAt, sourceName: source.name, length: sql<number>`length(${document.text})` })
      .from(document)
      .leftJoin(source, eq(document.sourceId, source.id))
      .where(eq(document.status, "nowy"))
      .orderBy(source.name, desc(document.fetchedAt))
      .limit(limit),
    db().select({ n: count() }).from(document).where(eq(document.status, "nowy")),
  ])
  return { rows, total: total?.n ?? 0 }
}

export async function listPartners() {
  return db()
    .select({
      id: partner.id,
      name: partner.name,
      kind: partner.kind,
      region: partner.region,
      description: partner.description,
      tags: partner.tags,
      url: partner.url,
      matches: count(match.id),
    })
    .from(partner)
    .leftJoin(match, eq(match.partnerId, partner.id))
    .groupBy(partner.id)
    .orderBy(partner.kind, partner.name)
}

export async function radarStats() {
  const since = sql`now() - interval '30 days'`
  const active = ne(innovation.status, "odrzucona")
  const [total, byArea, byLevel, byTrl, byRegion, byRecommendation, documents, merged, recent, averages, topSearches, topViewed, sources] = await Promise.all([
    db().select({ n: count() }).from(innovation).where(active),
    db().select({ key: innovation.area, n: count() }).from(innovation).where(active).groupBy(innovation.area),
    db().select({ key: innovation.level, n: count() }).from(innovation).where(active).groupBy(innovation.level),
    db().select({ key: innovation.trl, n: count() }).from(innovation).where(and(active, isNotNull(innovation.trl))).groupBy(innovation.trl).orderBy(innovation.trl),
    db().select({ key: sql<string>`coalesce(${innovation.region}, 'nieznany')`, n: count() }).from(innovation).where(active).groupBy(sql`1`),
    db().select({ key: sql<string>`${innovation.recommendation}->>'primary'`, n: count() }).from(innovation).where(active).groupBy(sql`1`),
    db().select({ key: document.status, n: count() }).from(document).groupBy(document.status),
    db().select({ n: count() }).from(event).where(eq(event.kind, "nowe_zrodlo")),
    db().select({ n: count() }).from(innovation).where(and(active, gte(innovation.createdAt, sql`now() - interval '7 days'`))),
    db().select({ potential: sql<number>`avg(${innovation.potential})`, credibility: sql<number>`avg(${innovation.credibility})` }).from(innovation).where(active),
    db()
      .select({ query: sql<string>`lower(${searchLog.query})`, n: count(), avgResults: sql<number>`avg(${searchLog.results})` })
      .from(searchLog)
      .where(and(isNotNull(searchLog.query), gte(searchLog.at, since)))
      .groupBy(sql`1`)
      .orderBy(desc(count()))
      .limit(8),
    db()
      .select({ slug: innovation.slug, title: innovation.title, n: count() })
      .from(viewLog)
      .innerJoin(innovation, eq(viewLog.innovationId, innovation.id))
      .where(gte(viewLog.at, since))
      .groupBy(innovation.id)
      .orderBy(desc(count()))
      .limit(6),
    db()
      .select({ id: source.id, name: source.name, kind: source.kind, url: source.url, lastRunAt: source.lastRunAt, documents: count(document.id) })
      .from(source)
      .leftJoin(document, eq(document.sourceId, source.id))
      .groupBy(source.id)
      .orderBy(source.name),
  ])
  const levelOrder = (k: string) => IMPLEMENTATION_LEVELS.indexOf(k as ImplementationLevel)
  return {
    total: total[0]?.n ?? 0,
    byArea,
    byLevel: [...byLevel].sort((a, b) => levelOrder(a.key) - levelOrder(b.key)),
    byTrl,
    byRegion,
    byRecommendation,
    documents: Object.fromEntries(documents.map((r) => [r.key, r.n])) as Record<string, number>,
    merged: merged[0]?.n ?? 0,
    recent: recent[0]?.n ?? 0,
    avgPotential: averages[0]?.potential != null ? Number(averages[0].potential) : null,
    avgCredibility: averages[0]?.credibility != null ? Number(averages[0].credibility) : null,
    topSearches: topSearches.map((s) => ({ ...s, avgResults: Number(s.avgResults) })),
    topViewed,
    sources,
  }
}
