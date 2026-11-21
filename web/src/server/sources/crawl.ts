import "server-only"
import { asc, eq } from "drizzle-orm"
import { db } from "@/server/db"
import { document, source } from "@/server/db/schema"
import { AUTO_PROMOTE_THRESHOLD } from "@/lib/domain"
import { promoteDocument, screenDocument, storeDocument } from "@/server/pipeline/ingest"
import { USER_AGENT, fetchPage } from "./fetch-page"
import { canFetch } from "./robots"

export type SourceConfig = { articlePattern?: string }

const NAV = /(category|kategori|filtr|tag|page|strona|szukaj|search|archiwum|kalendarz|kontakt|logowanie|login|mapa-strony|rodo|cookies|deklaracja-dostepnosci)/i
const FILES = /\.(pdf|jpe?g|png|gif|docx?|xlsx?|zip)$/i

function looksLikeArticle(url: URL): boolean {
  if (url.search || NAV.test(url.pathname) || FILES.test(url.pathname)) return false
  const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "").replace(/\.html?$/, "")
  return last.split("-").length >= 5 && last.length >= 25
}

export function extractArticleLinks(html: string, baseUrl: string, limit: number, pattern?: string): string[] {
  const base = new URL(baseUrl)
  const matcher = pattern ? new RegExp(pattern) : null
  const links = new Set<string>()
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
    let url: URL
    try {
      url = new URL(m[1].replace(/&amp;/g, "&"), base)
    } catch {
      continue
    }
    if (url.hostname !== base.hostname || url.href === base.href) continue
    const ok = matcher ? matcher.test(url.pathname + url.search) : looksLikeArticle(url)
    if (!ok) continue
    url.hash = ""
    links.add(url.href)
    if (links.size >= limit) break
  }
  return [...links]
}

export type CrawlResult = { url: string; status: string; title?: string | null; reason?: string }

export async function crawlSource(
  sourceId: number,
  { limit = 15, delayMs = 1500, screen = true }: { limit?: number; delayMs?: number; screen?: boolean } = {},
): Promise<CrawlResult[]> {
  const [src] = await db().select().from(source).where(eq(source.id, sourceId))
  if (!src?.url) throw new Error(`Source ${sourceId} has no URL`)
  if (!(await canFetch(src.url))) throw new Error("robots.txt nie pozwala czytać tej strony")

  const listing = await fetch(src.url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(15000) })
  if (!listing.ok) throw new Error(`Listing ${src.url} returned ${listing.status}`)
  const config = (src.config ?? {}) as SourceConfig
  const links = extractArticleLinks(await listing.text(), listing.url, limit, config.articlePattern)

  const results: CrawlResult[] = []
  for (const url of links) {
    try {
      if (!(await canFetch(url))) {
        results.push({ url, status: "pominięty (robots.txt)" })
        continue
      }
      const page = await fetchPage(url)
      const doc = await storeDocument({ text: page.text, url: page.url, title: page.title, sourceId, institutionId: src.institutionId })
      if (!doc.created) {
        results.push({ url, status: "pominięty (już w bazie)", title: page.title })
      } else if (!screen) {
        results.push({ url, status: "pobrany", title: page.title })
      } else {
        const screened = await screenDocument(doc.id)
        if (screened.status === "kandydat" && screened.score >= AUTO_PROMOTE_THRESHOLD) {
          const promoted = await promoteDocument(doc.id, { author: "radar", note: "Wykryta automatycznie: " + (src.name ?? "") })
          results.push({ url, status: promoted.merged ? "nowe źródło istniejącej" : "dodana", title: page.title, reason: screened.reason })
        } else {
          results.push({ url, status: screened.status, title: page.title, reason: screened.reason })
        }
      }
    } catch (error) {
      results.push({ url, status: "błąd", reason: error instanceof Error ? error.message : String(error) })
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  await db().update(source).set({ lastRunAt: new Date() }).where(eq(source.id, sourceId))
  return results
}

export async function screenPending(limit = 100) {
  const pending = await db()
    .select({ id: document.id, title: document.title })
    .from(document)
    .where(eq(document.status, "nowy"))
    .orderBy(asc(document.fetchedAt))
    .limit(limit)
  const results: CrawlResult[] = []
  for (const doc of pending) {
    try {
      const screened = await screenDocument(doc.id)
      if (screened.status === "kandydat" && screened.score >= AUTO_PROMOTE_THRESHOLD) {
        const promoted = await promoteDocument(doc.id, { author: "radar", note: "Wykryta automatycznie" })
        results.push({ url: String(doc.id), status: promoted.merged ? "nowe źródło istniejącej" : "dodana", title: doc.title, reason: screened.reason })
        continue
      }
      results.push({ url: String(doc.id), status: screened.status, title: doc.title, reason: screened.reason })
    } catch (error) {
      results.push({ url: String(doc.id), status: "błąd", title: doc.title, reason: error instanceof Error ? error.message : String(error) })
    }
  }
  return results
}
