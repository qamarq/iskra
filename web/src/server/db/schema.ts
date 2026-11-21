import { sql } from "drizzle-orm"
import { index, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex, vector } from "drizzle-orm/pg-core"
import type { InnovationCard, InnovationType, InstitutionType } from "@/lib/card"
import type {
  Criterion,
  DetectionResult,
  DocumentStatus,
  InnovationStatus,
  MatchStatus,
  PartnerKind,
  PathwayRecommendation,
  PriorArtSource,
  SourceKind,
} from "@/lib/domain"

export const EMBEDDING_DIMENSIONS = 1536

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow()

export const institution = pgTable(
  "iskra_institution",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").$type<InstitutionType>().notNull(),
    region: text("region"),
    city: text("city"),
    website: text("website"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("iskra_institution_name_idx").on(t.name)],
)

export const source = pgTable("iskra_source", {
  id: serial("id").primaryKey(),
  kind: text("kind").$type<SourceKind>().notNull(),
  name: text("name").notNull(),
  url: text("url"),
  institutionId: integer("institution_id").references(() => institution.id),
  config: jsonb("config").$type<Record<string, unknown>>(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: createdAt(),
})

export const document = pgTable(
  "iskra_document",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id").references(() => source.id),
    institutionId: integer("institution_id").references(() => institution.id),
    url: text("url"),
    title: text("title"),
    text: text("text").notNull(),
    contentHash: text("content_hash").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").$type<DocumentStatus>().notNull().default("nowy"),
    detection: jsonb("detection").$type<DetectionResult>(),
  },
  (t) => [uniqueIndex("iskra_document_hash_idx").on(t.contentHash), index("iskra_document_status_idx").on(t.status)],
)

export const innovation = pgTable(
  "iskra_innovation",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    type: text("type").$type<InnovationType>().notNull(),
    institutionId: integer("institution_id").references(() => institution.id),
    documentId: integer("document_id").references(() => document.id),
    card: jsonb("card").$type<InnovationCard>().notNull(),
    status: text("status").$type<InnovationStatus>().notNull().default("wykryta"),
    score: real("score"),
    confidence: real("confidence"),
    pathway: jsonb("pathway").$type<PathwayRecommendation>(),
    duplicateOfId: integer("duplicate_of_id"),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("iskra_innovation_slug_idx").on(t.slug),
    index("iskra_innovation_status_idx").on(t.status),
    index("iskra_innovation_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
)

export const evaluation = pgTable(
  "iskra_evaluation",
  {
    id: serial("id").primaryKey(),
    innovationId: integer("innovation_id")
      .notNull()
      .references(() => innovation.id, { onDelete: "cascade" }),
    criterion: text("criterion").$type<Criterion>().notNull(),
    score: integer("score").notNull(),
    rationale: text("rationale").notNull(),
    evidence: text("evidence"),
    confidence: real("confidence").notNull(),
    author: text("author").notNull().default("ai"),
    createdAt: createdAt(),
  },
  (t) => [index("iskra_evaluation_innovation_idx").on(t.innovationId, t.criterion, t.createdAt)],
)

export const priorArt = pgTable(
  "iskra_prior_art",
  {
    id: serial("id").primaryKey(),
    innovationId: integer("innovation_id")
      .notNull()
      .references(() => innovation.id, { onDelete: "cascade" }),
    source: text("source").$type<PriorArtSource>().notNull(),
    externalId: text("external_id"),
    title: text("title").notNull(),
    url: text("url"),
    snippet: text("snippet"),
    similarity: real("similarity"),
    createdAt: createdAt(),
  },
  (t) => [index("iskra_prior_art_innovation_idx").on(t.innovationId)],
)

export const partner = pgTable(
  "iskra_partner",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind").$type<PartnerKind>().notNull(),
    region: text("region"),
    description: text("description").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    url: text("url"),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    createdAt: createdAt(),
  },
  (t) => [index("iskra_partner_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops"))],
)

export const match = pgTable(
  "iskra_match",
  {
    id: serial("id").primaryKey(),
    innovationId: integer("innovation_id")
      .notNull()
      .references(() => innovation.id, { onDelete: "cascade" }),
    partnerId: integer("partner_id")
      .notNull()
      .references(() => partner.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    reason: text("reason").notNull(),
    message: text("message"),
    status: text("status").$type<MatchStatus>().notNull().default("zaproponowane"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("iskra_match_pair_idx").on(t.innovationId, t.partnerId)],
)

export const event = pgTable(
  "iskra_event",
  {
    id: serial("id").primaryKey(),
    innovationId: integer("innovation_id")
      .notNull()
      .references(() => innovation.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").$type<InnovationStatus>(),
    toStatus: text("to_status").$type<InnovationStatus>().notNull(),
    note: text("note"),
    author: text("author").notNull().default("system"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("iskra_event_innovation_idx").on(t.innovationId, t.at)],
)
