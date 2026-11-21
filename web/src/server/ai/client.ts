import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import type { z } from "zod"
import { EMBEDDING_DIMENSIONS } from "@/server/db/schema"
import { embeddingConfig, llmConfig, openaiCredentials } from "@/server/env"

export type Tier = "main" | "detect"

let anthropicClient: Anthropic | undefined
let openaiClient: OpenAI | undefined
let embeddingClient: OpenAI | undefined

function anthropic(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic()
  return anthropicClient
}

function openai(): OpenAI {
  if (!openaiClient) {
    const creds = openaiCredentials()
    if (!creds) throw new Error("OPENAI_API_KEY is not set")
    openaiClient = new OpenAI(creds)
  }
  return openaiClient
}

async function structuredAnthropic<T extends z.ZodType>(schema: T, instructions: string, input: string, model: string, tier: Tier): Promise<z.infer<T>> {
  const response = await anthropic().beta.messages.parse({
    model,
    max_tokens: 16000,
    system: instructions,
    messages: [{ role: "user", content: input }],
    output_config: { format: betaZodOutputFormat(schema), effort: tier === "detect" ? "low" : "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  })
  if (response.stop_reason === "refusal") {
    throw new Error("Model odmówił odpowiedzi (" + (response.stop_details?.category ?? "bez kategorii") + ")")
  }
  if (response.stop_reason === "max_tokens") throw new Error("Odpowiedź modelu przekroczyła limit długości")
  if (response.parsed_output == null) throw new Error("Model nie zwrócił poprawnej struktury")
  return response.parsed_output as z.infer<T>
}

async function structuredOpenAI<T extends z.ZodType>(schema: T, name: string, instructions: string, input: string, model: string): Promise<z.infer<T>> {
  const completion = await openai().chat.completions.parse({
    model,
    messages: [
      { role: "system", content: instructions },
      { role: "user", content: input },
    ],
    response_format: zodResponseFormat(schema, name),
  })
  const parsed = completion.choices[0]?.message.parsed
  if (!parsed) throw new Error(`Model returned no ${name}`)
  return parsed as z.infer<T>
}

export async function structured<T extends z.ZodType>(
  schema: T,
  name: string,
  instructions: string,
  input: string,
  { tier = "main" }: { tier?: Tier } = {},
): Promise<z.infer<T>> {
  const config = llmConfig()
  const model = tier === "detect" ? config.detectModel : config.model
  return config.provider === "anthropic"
    ? structuredAnthropic(schema, instructions, input, model, tier)
    : structuredOpenAI(schema, name, instructions, input, model)
}

export function embeddingsEnabled(): boolean {
  return embeddingConfig() != null
}

export async function embed(texts: string[]): Promise<number[][] | null> {
  const config = embeddingConfig()
  if (!config || texts.length === 0) return null
  if (!embeddingClient) embeddingClient = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
  const response = await embeddingClient.embeddings.create({
    model: config.model,
    input: texts,
    ...(config.model.includes("text-embedding-3") ? { dimensions: EMBEDDING_DIMENSIONS } : {}),
  })
  return [...response.data].sort((a, b) => a.index - b.index).map((d) => d.embedding)
}
