import "server-only"

export const USER_AGENT = "ISKRA radar innowacji (prototyp HackNation 2026)"

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", oacute: "ó", Oacute: "Ó", ndash: "–", mdash: "—", bdquo: "„", rdquo: "”" }

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name] ?? m)
}

const CONTENT_MARKERS = /<(div|section)[^>]*(?:class="[^"]*(?:theme-post-content|entry-content|post-content|article-content|news-content|article__body|news-body)[^"]*"|itemprop="articleBody")[^>]*>/i

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim()
}

export function htmlToText(html: string): { title: string | null; text: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null
  const clean = html.replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
  const marker = clean.match(CONTENT_MARKERS)
  if (marker?.index != null) {
    const fromContent = stripTags(clean.slice(marker.index, marker.index + 60000))
    if (fromContent.length >= 300) return { title: title ? decodeEntities(title) : null, text: (title ? decodeEntities(title) + "\n\n" : "") + fromContent }
  }
  let body = clean.replace(/<(nav|header|footer|form|aside)[^>]*>[\s\S]*?<\/\1>/gi, " ")
  const main = body.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i)?.[2]
  if (main && main.length > 500) body = main
  let text = stripTags(body)
  if (text.length < 200) text = stripTags(clean)
  return { title: title ? decodeEntities(title) : null, text }
}

export async function fetchPage(url: string): Promise<{ title: string | null; text: string; url: string }> {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`Nie udało się pobrać strony (${response.status})`)
  const type = response.headers.get("content-type") ?? ""
  if (!type.includes("html") && !type.includes("text")) throw new Error(`Nieobsługiwany typ treści: ${type || "nieznany"}`)
  const { title, text } = htmlToText(await response.text())
  if (text.length < 200) throw new Error("Strona zawiera za mało tekstu do analizy")
  return { title, text, url: response.url }
}
