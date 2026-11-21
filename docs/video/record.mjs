import { chromium } from "playwright-core"
import fs from "node:fs"
const out = process.argv[2]
const BASE = "https://iskra.kamilmarczak.pl"
const W = 1920, H = 1080
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" })

const INIT = `
(() => {
  const style = document.createElement("style")
  style.textContent = "html{zoom:1.25}#fx-cursor{position:fixed;z-index:2147483647;left:0;top:0;opacity:0;width:30px;height:30px;pointer-events:none;transform:translate(-4px,-2px);transition:transform .08s}#fx-cursor svg{filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}.fx-ripple{position:fixed;z-index:2147483646;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #E4572E;pointer-events:none;animation:fxr .55s ease-out forwards}@keyframes fxr{to{transform:scale(4);opacity:0}}"
  const add = () => {
    if (document.getElementById("fx-cursor")) return
    document.head.appendChild(style)
    const c = document.createElement("div")
    c.id = "fx-cursor"
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#1D1A2B" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    document.body.appendChild(c)
    const z = 1.25
    window.addEventListener("mousemove", (e) => { c.style.opacity = "1"; c.style.left = e.clientX * z + "px"; c.style.top = e.clientY * z + "px" }, true)
    window.addEventListener("mousedown", (e) => {
      c.style.transform = "translate(-4px,-2px) scale(.8)"
      const r = document.createElement("div"); r.className = "fx-ripple"; r.style.left = e.clientX * z + "px"; r.style.top = e.clientY * z + "px"
      document.body.appendChild(r); setTimeout(() => r.remove(), 600)
    }, true)
    window.addEventListener("mouseup", () => { c.style.transform = "translate(-4px,-2px)" }, true)
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add()
  new MutationObserver(add).observe(document.documentElement, { childList: true, subtree: false })
})()
`

async function scene(name, fn) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out + "/raw-" + name, size: { width: W, height: H } } })
  await ctx.addInitScript(INIT)
  const p = await ctx.newPage()
  p.setDefaultTimeout(30000)
  const t0 = Date.now()
  await fn(p)
  const video = p.video()
  await ctx.close()
  const path = await video.path()
  fs.renameSync(path, out + "/" + name + ".webm")
  fs.rmSync(out + "/raw-" + name, { recursive: true, force: true })
  console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + "s")
}

async function moveTo(p, locator, steps = 28) {
  const box = await locator.boundingBox()
  if (!box) return
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps })
}
async function smoothScroll(p, to, ms = 1600) {
  await p.evaluate(async ([to, ms]) => {
    const from = window.scrollY, start = performance.now()
    await new Promise((res) => {
      const step = (t) => {
        const k = Math.min(1, (t - start) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        window.scrollTo(0, from + (to - from) * e)
        k < 1 ? requestAnimationFrame(step) : res()
      }
      requestAnimationFrame(step)
    })
  }, [to, ms])
}

await scene("s1-search", async (p) => {
  await p.goto(BASE + "/", { waitUntil: "networkidle" })
  await p.evaluate(() => localStorage.removeItem("iskra-compare"))
  await p.mouse.move(300, 300)
  await p.waitForTimeout(600)
  const bot = p.locator('[aria-label="Iskierka: kliknij, żeby porozmawiać"]')
  await moveTo(p, bot, 35)
  await p.waitForTimeout(400)
  await bot.click(); await p.waitForTimeout(900)
  await bot.click(); await p.waitForTimeout(900)
  const ex = p.getByRole("button", { name: "skrócenie kolejek w urzędzie" })
  await moveTo(p, ex, 35)
  await p.waitForTimeout(300)
  await ex.click()
  await p.waitForURL(/innowacje/, { timeout: 30000 })
  await p.waitForTimeout(1400)
  const cards = p.locator("a.card-drop")
  await moveTo(p, cards.nth(0), 30); await p.waitForTimeout(500)
  await moveTo(p, cards.nth(1), 30); await p.waitForTimeout(600)
  const c1 = cards.nth(0).getByRole("button", { name: "+ Porównaj" })
  await moveTo(p, c1, 25); await c1.click(); await p.waitForTimeout(1100)
  const c2 = cards.nth(1).getByRole("button", { name: "+ Porównaj" })
  await moveTo(p, c2, 25); await c2.click(); await p.waitForTimeout(1200)
  const go = p.getByRole("link", { name: "Porównaj", exact: true }).last()
  await moveTo(p, go, 30); await go.click()
  await p.waitForURL(/porownaj\?k=/)
  await p.waitForTimeout(1200)
  await smoothScroll(p, 520, 1800)
  await p.waitForTimeout(800)
  await p.evaluate(() => localStorage.removeItem("iskra-compare"))
})

await scene("s2-card", async (p) => {
  await p.goto(BASE + "/innowacje?q=" + encodeURIComponent("antybakteryjna powłoka na ekrany dotykowe"), { waitUntil: "networkidle" })
  await p.mouse.move(900, 200)
  await p.waitForTimeout(700)
  const card = p.locator("a.card-drop").first()
  await moveTo(p, card, 30); await p.waitForTimeout(500)
  await card.click()
  await p.waitForURL(/innowacje\/antybakteryjna/)
  await p.waitForTimeout(1600)
  await smoothScroll(p, 430, 1500); await p.waitForTimeout(1300)
  await smoothScroll(p, 1250, 1800); await p.waitForTimeout(1200)
  await smoothScroll(p, 2050, 1800); await p.waitForTimeout(1300)
})

await scene("s3-analyze", async (p) => {
  await p.goto(BASE + "/analizuj", { waitUntil: "networkidle" })
  await p.mouse.move(700, 300)
  const input = p.locator("input[type=url]")
  await moveTo(p, input, 25); await input.click()
  await p.keyboard.type("https://www.ur.edu.pl/en/university/news/another-patent-for-an-innovative-antibacterial-coating-awarded-to-the-university-of-rzeszow-and-the-podkarpackie-innovation-centre", { delay: 6 })
  const btn = p.getByRole("button", { name: "Przeanalizuj" })
  await moveTo(p, btn, 20); await btn.click()
  await p.waitForTimeout(5200)
})

await scene("s4-radar", async (p) => {
  await p.goto(BASE + "/weryfikacja", { waitUntil: "networkidle" })
  await p.mouse.move(1300, 400, { steps: 20 })
  await p.waitForTimeout(800)
  await smoothScroll(p, 700, 2200); await p.waitForTimeout(600)
  await p.goto(BASE + "/mierniki", { waitUntil: "networkidle" })
  await p.mouse.move(1200, 500, { steps: 10 })
  await p.waitForTimeout(900)
  const y = await p.evaluate(() => { const h = [...document.querySelectorAll("h3")].find((e) => e.textContent.includes("Źródła i cykliczna")); return h ? h.getBoundingClientRect().top + window.scrollY - 80 : 1800 })
  await smoothScroll(p, y, 2800); await p.waitForTimeout(1600)
})

await b.close()
