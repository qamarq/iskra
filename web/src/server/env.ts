import "server-only"

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return url
}

export type LlmProvider = "anthropic" | "openai"

export function llmConfig() {
  const provider = (process.env.LLM_PROVIDER || (process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai")) as LlmProvider
  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set")
    return {
      provider,
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      detectModel: process.env.ANTHROPIC_DETECT_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    }
  }
  if (!process.env.OPENAI_API_KEY) throw new Error("Brak klucza API modelu: ustaw ANTHROPIC_API_KEY albo OPENAI_API_KEY")
  return {
    provider,
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    detectModel: process.env.OPENAI_DETECT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini",
  }
}

export function openaiCredentials() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return { apiKey, baseURL: process.env.OPENAI_BASE_URL || undefined }
}

export function embeddingConfig() {
  const apiKey = process.env.OPENAI_EMBEDDING_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return {
    apiKey,
    baseURL: process.env.OPENAI_EMBEDDING_BASE_URL || process.env.OPENAI_BASE_URL || undefined,
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  }
}

export function hasLlm(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)
}
