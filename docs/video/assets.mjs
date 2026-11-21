import { chromium } from "playwright-core"
const [, , html, out, ids] = process.argv
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" })
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
await p.goto("file://" + html, { waitUntil: "networkidle" })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.locator("#intro").screenshot({ path: out + "/intro.png" })
await p.locator("#outro").screenshot({ path: out + "/outro.png" })
for (const id of ids.split(",")) await p.locator("#" + id).screenshot({ path: out + "/" + id + ".png", omitBackground: true })
await b.close()
console.log("ok")
