import "server-only"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import type { z } from "zod"
import { EMBEDDING_DIMENSIONS } from "@/server/db/schema"
import { openaiConfig } from "@/server/env"

let client: OpenAI | undefined

function openai(): OpenAI {
  if (!client) {
    const { apiKey, baseURL } = openaiConfig()
    client = new OpenAI({ apiKey, baseURL })
  }
  return client
}

export async function structured<T extends z.ZodType>(
  schema: T,
  name: string,
  instructions: string,
  input: string,
  options: { model?: string } = {},
): Promise<z.infer<T>> {
  const completion = await openai().chat.completions.parse({
    model: options.model ?? openaiConfig().model,
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

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const model = openaiConfig().embeddingModel
  const response = await openai().embeddings.create({
    model,
    input: texts,
    ...(model.includes("text-embedding-3") ? { dimensions: EMBEDDING_DIMENSIONS } : {}),
  })
  return [...response.data].sort((a, b) => a.index - b.index).map((d) => d.embedding)
}
