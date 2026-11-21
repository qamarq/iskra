import "server-only"
import { and, asc, count, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm"
import type { InnovationType } from "@/lib/card"
import type { Criterion, InnovationStatus, Pathway } from "@/lib/domain"
import { db } from "@/server/db"
import { document, evaluation, event, innovation, institution, match, partner, priorArt, source } from "@/server/db/schema"

export type InnovationFilters = { q?: string; type?: InnovationType; status?: InnovationStatus; pathway?: Pathway }

export async function listInnovations(filters: InnovationFilters = {}) {
  const conditions = [
    filters.q ? or(ilike(innovation.title, `%${filters.q}%`), ilike(innovation.summary, `%${filters.q}%`), ilike(institution.name, `%${filters.q}%`)) : undefined,
    filters.type ? eq(innovation.type, filters.type) : undefined,
    filters.status ? eq(innovation.status, filters.status) : undefined,
    filters.pathway ? sql`${innovation.pathway}->>'primary' = ${filters.pathway}` : undefined,
  ]
  return db()
    .select({
      id: innovation.id,
      slug: innovation.slug,
      title: innovation.title,
      summary: innovation.summary,
      type: innovation.type,
      status: innovation.status,
      score: innovation.score,
      confidence: innovation.confidence,
      pathway: innovation.pathway,
      duplicateOfId: innovation.duplicateOfId,
      stage: sql<string>`${innovation.card}->'maturity'->'value'->>'stage'`,
      institution: institution.name,
      institutionType: institution.type,
      createdAt: innovation.createdAt,
    })
    .from(innovation)
    .leftJoin(institution, eq(innovation.institutionId, institution.id))
    .where(and(...conditions))
    .orderBy(sql`${innovation.score} desc nulls last`, desc(innovation.createdAt))
}

export type InnovationListItem = Awaited<ReturnType<typeof listInnovations>>[number]

export async function getInnovation(slug: string) {
  const [row] = await db()
    .select({
      innovation,
      institution,
      document: { id: document.id, url: document.url, title: document.title, fetchedAt: document.fetchedAt, sourceKind: source.kind },
    })
    .from(innovation)
    .leftJoin(institution, eq(innovation.institutionId, institution.id))
    .leftJoin(document, eq(innovation.documentId, document.id))
    .leftJoin(source, eq(document.sourceId, source.id))
    .where(eq(innovation.slug, slug))
  if (!row) return null
  const id = row.innovation.id

  const [evaluations, priorArtRows, matches, events, duplicateOf] = await Promise.all([
    db()
      .selectDistinctOn([evaluation.criterion])
      .from(evaluation)
      .where(eq(evaluation.innovationId, id))
      .orderBy(evaluation.criterion, desc(evaluation.createdAt)),
    db().select().from(priorArt).where(eq(priorArt.innovationId, id)).orderBy(desc(priorArt.similarity)),
    db()
      .select({ match, partner: { id: partner.id, name: partner.name, kind: partner.kind, region: partner.region, url: partner.url, description: partner.description } })
      .from(match)
      .innerJoin(partner, eq(match.partnerId, partner.id))
      .where(eq(match.innovationId, id))
      .orderBy(desc(match.score)),
    db().select().from(event).where(eq(event.innovationId, id)).orderBy(asc(event.at)),
    row.innovation.duplicateOfId
      ? db()
          .select({ slug: innovation.slug, title: innovation.title })
          .from(innovation)
          .where(eq(innovation.id, row.innovation.duplicateOfId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ])

  const { embedding: _embedding, ...rest } = row.innovation
  void _embedding
  return {
    ...rest,
    institution: row.institution,
    document: row.document?.id ? row.document : null,
    evaluations: Object.fromEntries(evaluations.map((e) => [e.criterion, e])) as Partial<Record<Criterion, (typeof evaluations)[number]>>,
    priorArt: priorArtRows,
    matches,
    events,
    duplicateOf,
  }
}

export type InnovationDetail = NonNullable<Awaited<ReturnType<typeof getInnovation>>>

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
      .select({
        id: document.id,
        title: document.title,
        url: document.url,
        fetchedAt: document.fetchedAt,
        sourceName: source.name,
        length: sql<number>`length(${document.text})`,
      })
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
  const rows = await db()
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
  return rows
}

export async function funnelStats() {
  const [byStatus, byType, byInstitutionType, bySource, documents, duplicates, matchesByStatus, timing, avgScore] = await Promise.all([
    db().select({ status: innovation.status, n: count() }).from(innovation).groupBy(innovation.status),
    db().select({ type: innovation.type, n: count() }).from(innovation).groupBy(innovation.type),
    db()
      .select({ type: institution.type, n: count() })
      .from(innovation)
      .innerJoin(institution, eq(innovation.institutionId, institution.id))
      .groupBy(institution.type),
    db()
      .select({ kind: sql<string>`coalesce(${source.kind}, 'zgloszenie')`, n: count() })
      .from(innovation)
      .leftJoin(document, eq(innovation.documentId, document.id))
      .leftJoin(source, eq(document.sourceId, source.id))
      .groupBy(sql`1`),
    db().select({ status: document.status, n: count() }).from(document).groupBy(document.status),
    db().select({ n: count() }).from(innovation).where(isNotNull(innovation.duplicateOfId)),
    db().select({ status: match.status, n: count() }).from(match).groupBy(match.status),
    db()
      .select({
        hours: sql<number>`avg(extract(epoch from (r.at - w.at)) / 3600)`,
      })
      .from(sql`iskra_event w join iskra_event r on r.innovation_id = w.innovation_id and r.to_status = 'rekomendowana'`)
      .where(sql`w.to_status = 'wykryta'`),
    db().select({ avg: sql<number>`avg(${innovation.score})` }).from(innovation),
  ])
  return {
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Partial<Record<InnovationStatus, number>>,
    byType,
    byInstitutionType,
    bySource,
    documents: Object.fromEntries(documents.map((r) => [r.status, r.n])) as Record<string, number>,
    duplicates: duplicates[0]?.n ?? 0,
    matchesByStatus: Object.fromEntries(matchesByStatus.map((r) => [r.status, r.n])) as Record<string, number>,
    avgHoursToRecommendation: timing[0]?.hours != null ? Number(timing[0].hours) : null,
    avgScore: avgScore[0]?.avg != null ? Number(avgScore[0].avg) : null,
  }
}
