import "server-only"
import { and, cosineDistance, eq, isNotNull, ne, sql } from "drizzle-orm"
import type { InnovationStatus } from "@/lib/domain"
import { db } from "@/server/db"
import { innovation, institution } from "@/server/db/schema"

export type SimilarInnovation = {
  id: number
  slug: string
  title: string
  institution: string | null
  institutionId: number | null
  status: InnovationStatus
  similarity: number
}

export async function findSimilarInnovations(
  embedding: number[],
  { excludeId, limit = 5, minSimilarity = 0 }: { excludeId?: number; limit?: number; minSimilarity?: number } = {},
): Promise<SimilarInnovation[]> {
  const distance = cosineDistance(innovation.embedding, embedding)
  const rows = await db()
    .select({
      id: innovation.id,
      slug: innovation.slug,
      title: innovation.title,
      institution: institution.name,
      institutionId: innovation.institutionId,
      status: innovation.status,
      similarity: sql<number>`1 - (${distance})`,
    })
    .from(innovation)
    .leftJoin(institution, eq(innovation.institutionId, institution.id))
    .where(and(isNotNull(innovation.embedding), excludeId ? ne(innovation.id, excludeId) : undefined))
    .orderBy(distance)
    .limit(limit)
  return rows.map((r) => ({ ...r, similarity: Number(r.similarity) })).filter((r) => r.similarity >= minSimilarity)
}
