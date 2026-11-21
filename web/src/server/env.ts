import "server-only"

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

export function databaseUrl(): string {
  return required("DATABASE_URL")
}

export function openaiConfig() {
  return {
    apiKey: required("OPENAI_API_KEY"),
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  }
}
