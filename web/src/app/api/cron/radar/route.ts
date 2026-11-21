import { after } from "next/server"
import { runRadar } from "@/server/sources/radar-run"

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  after(async () => {
    const result = await runRadar()
    console.log("radar run", JSON.stringify({ sources: result.report.length, pending: result.pending.length, rechecked: result.rechecked.length }))
  })
  return Response.json({ started: true }, { status: 202 })
}
