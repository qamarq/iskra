import "server-only"
import { eq } from "drizzle-orm"
import { INNOVATION_STATUSES, type InnovationStatus } from "@/lib/domain"
import { db } from "@/server/db"
import { event, innovation } from "@/server/db/schema"

export async function setStatus(
  innovationId: number,
  to: InnovationStatus,
  { note, author = "system", onlyForward = true }: { note?: string; author?: string; onlyForward?: boolean } = {},
): Promise<boolean> {
  const [current] = await db().select({ status: innovation.status }).from(innovation).where(eq(innovation.id, innovationId))
  if (!current) throw new Error(`Innovation ${innovationId} not found`)
  const from = current.status
  if (from === to) return false
  if (onlyForward && to !== "odrzucona" && INNOVATION_STATUSES.indexOf(to) < INNOVATION_STATUSES.indexOf(from)) return false
  await db().update(innovation).set({ status: to, updatedAt: new Date() }).where(eq(innovation.id, innovationId))
  await db().insert(event).values({ innovationId, fromStatus: from, toStatus: to, note, author })
  return true
}

export async function recordCreated(innovationId: number, note: string, author: string) {
  await db().insert(event).values({ innovationId, fromStatus: null, toStatus: "wykryta", note, author })
}
