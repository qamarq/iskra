import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { source } from "@/server/db/schema"
import { screenDocument, storeDocument } from "@/server/pipeline/ingest"
import { fetchPage } from "./fetch-page"

const ARTICLE_HINTS = /(aktualnosc|aktualnosci|news|wydarzen|artykul|komunikat|wiadomosc|post|\/\d{4}\/)/i
const SKIP = /\.(pdf|jpe?g|png|gif|docx?|xlsx?|zip)$|(kontakt|logowanie|login|mapa-strony|rodo|cookies|deklaracja-dostepnosci)/i

export function extractArticleLinks(html: string, baseUrl: string, limit: number): string[] {
  const base = new URL(baseUrl)
  const links = new Set<string>()
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
    try {
      const url = new URL(m[1], base)
      if (url.hostname !== base.hostname) continue
      if (url.href === base.href || SKIP.test(url.pathname)) continue
      if (!ARTICLE_HINTS.test(url.pathname)) continue
      if (url.pathname.split("/").filter(Boolean).length < 2) continue
      url.hash = ""
      links.add(url.href)
    } catch {}
    if (links.size >= limit) break
  }
  return [...links]
}

export async function crawlSource(sourceId: number, { limit = 15, delayMs = 1500 }: { limit?: number; delayMs?: number } = {}) {
  const [src] = await db().select().from(source).where(eq(source.id, sourceId))
  if (!src?.url) throw new Error(`Source ${sourceId} has no URL`)

  const listing = await fetch(src.url, {
    headers: { "user-agent": "ISKRA radar innowacji (prototyp HackNation 2026)" },
    signal: AbortSignal.timeout(15000),
  })
  if (!listing.ok) throw new Error(`Listing ${src.url} returned ${listing.status}`)
  const links = extractArticleLinks(await listing.text(), listing.url, limit)

  const results: { url: string; status: string; reason?: string }[] = []
  for (const url of links) {
    try {
      const page = await fetchPage(url)
      const doc = await storeDocument({ text: page.text, url: page.url, title: page.title, sourceId, institutionId: src.institutionId })
      if (!doc.created) {
        results.push({ url, status: "pominięty (już w bazie)" })
      } else {
        const screened = await screenDocument(doc.id)
        results.push({ url, status: screened.status, reason: screened.reason })
      }
    } catch (error) {
      results.push({ url, status: "błąd", reason: error instanceof Error ? error.message : String(error) })
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  await db().update(source).set({ lastRunAt: new Date() }).where(eq(source.id, sourceId))
  return results
}
