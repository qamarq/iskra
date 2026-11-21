import "server-only"

type Rule = { allow: boolean; path: string }

const cache = new Map<string, Rule[]>()

export function parseRobots(txt: string): Rule[] {
  const rules: Rule[] = []
  let applies = false
  let inHeader = false
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim()
    if (!line) continue
    const idx = line.indexOf(":")
    if (idx < 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()
    if (key === "user-agent") {
      if (!inHeader) applies = false
      inHeader = true
      if (value === "*") applies = true
      continue
    }
    inHeader = false
    if (applies && (key === "allow" || key === "disallow") && value) rules.push({ allow: key === "allow", path: value })
  }
  return rules
}

function ruleRegex(path: string): RegExp {
  const anchored = path.endsWith("$")
  const body = (anchored ? path.slice(0, -1) : path)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*")
  return new RegExp("^" + body + (anchored ? "$" : ""))
}

export function isAllowed(rules: Rule[], pathWithQuery: string): boolean {
  let best: Rule | null = null
  for (const rule of rules) {
    if (!ruleRegex(rule.path).test(pathWithQuery)) continue
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) best = rule
  }
  return best ? best.allow : true
}

export async function robotsFor(url: URL): Promise<Rule[]> {
  const origin = url.origin
  const cached = cache.get(origin)
  if (cached) return cached
  const txt = await fetch(origin + "/robots.txt", { signal: AbortSignal.timeout(10000) })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "")
  const rules = parseRobots(txt)
  cache.set(origin, rules)
  return rules
}

export async function canFetch(url: string): Promise<boolean> {
  const u = new URL(url)
  return isAllowed(await robotsFor(u), u.pathname + u.search)
}
