CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "iskra_document" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"institution_id" integer,
	"url" text,
	"title" text,
	"text" text NOT NULL,
	"content_hash" text NOT NULL,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'nowy' NOT NULL,
	"detection" jsonb
);
--> statement-breakpoint
CREATE TABLE "iskra_evaluation" (
	"id" serial PRIMARY KEY NOT NULL,
	"innovation_id" integer NOT NULL,
	"criterion" text NOT NULL,
	"score" integer NOT NULL,
	"rationale" text NOT NULL,
	"evidence" text,
	"confidence" real NOT NULL,
	"author" text DEFAULT 'ai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iskra_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"innovation_id" integer NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"note" text,
	"author" text DEFAULT 'system' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iskra_innovation" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"type" text NOT NULL,
	"institution_id" integer,
	"document_id" integer,
	"card" jsonb NOT NULL,
	"status" text DEFAULT 'wykryta' NOT NULL,
	"score" real,
	"confidence" real,
	"pathway" jsonb,
	"duplicate_of_id" integer,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iskra_institution" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"region" text,
	"city" text,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iskra_match" (
	"id" serial PRIMARY KEY NOT NULL,
	"innovation_id" integer NOT NULL,
	"partner_id" integer NOT NULL,
	"score" real NOT NULL,
	"reason" text NOT NULL,
	"message" text,
	"status" text DEFAULT 'zaproponowane' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iskra_partner" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"region" text,
	"description" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"url" text,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iskra_prior_art" (
	"id" serial PRIMARY KEY NOT NULL,
	"innovation_id" integer NOT NULL,
	"source" text NOT NULL,
	"external_id" text,
	"title" text NOT NULL,
	"url" text,
	"snippet" text,
	"similarity" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iskra_source" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"institution_id" integer,
	"config" jsonb,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "iskra_document" ADD CONSTRAINT "iskra_document_source_id_iskra_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."iskra_source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_document" ADD CONSTRAINT "iskra_document_institution_id_iskra_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."iskra_institution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_evaluation" ADD CONSTRAINT "iskra_evaluation_innovation_id_iskra_innovation_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."iskra_innovation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_event" ADD CONSTRAINT "iskra_event_innovation_id_iskra_innovation_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."iskra_innovation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_innovation" ADD CONSTRAINT "iskra_innovation_institution_id_iskra_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."iskra_institution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_innovation" ADD CONSTRAINT "iskra_innovation_document_id_iskra_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."iskra_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_match" ADD CONSTRAINT "iskra_match_innovation_id_iskra_innovation_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."iskra_innovation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_match" ADD CONSTRAINT "iskra_match_partner_id_iskra_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."iskra_partner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_prior_art" ADD CONSTRAINT "iskra_prior_art_innovation_id_iskra_innovation_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."iskra_innovation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iskra_source" ADD CONSTRAINT "iskra_source_institution_id_iskra_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."iskra_institution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "iskra_document_hash_idx" ON "iskra_document" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "iskra_document_status_idx" ON "iskra_document" USING btree ("status");--> statement-breakpoint
CREATE INDEX "iskra_evaluation_innovation_idx" ON "iskra_evaluation" USING btree ("innovation_id","criterion","created_at");--> statement-breakpoint
CREATE INDEX "iskra_event_innovation_idx" ON "iskra_event" USING btree ("innovation_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "iskra_innovation_slug_idx" ON "iskra_innovation" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "iskra_innovation_status_idx" ON "iskra_innovation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "iskra_innovation_embedding_idx" ON "iskra_innovation" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "iskra_institution_name_idx" ON "iskra_institution" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "iskra_match_pair_idx" ON "iskra_match" USING btree ("innovation_id","partner_id");--> statement-breakpoint
CREATE INDEX "iskra_partner_embedding_idx" ON "iskra_partner" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "iskra_prior_art_innovation_idx" ON "iskra_prior_art" USING btree ("innovation_id");