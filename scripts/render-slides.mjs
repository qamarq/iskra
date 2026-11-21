import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const [, , dir, statsJson, chrome] = process.argv
const stats = JSON.parse(statsJson)
let html = readFileSync(dir + "/slides.html", "utf8")
for (const [k, v] of Object.entries(stats)) html = html.replaceAll("{{" + k + "}}", String(v))
writeFileSync(dir + "/slides.rendered.html", html)
execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=10000", "--print-to-pdf=" + dir + "/ISKRA-prezentacja.pdf", "file://" + dir + "/slides.rendered.html"], { stdio: "inherit" })
