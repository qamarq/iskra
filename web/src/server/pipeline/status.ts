import "server-only"
import { eq } from "drizzle-orm"
import type { EventKind, InnovationStatus } from "@/lib/domain"
import { db } from "@/server/db"
import { event, innovation } from "@/server/db/schema"

export async function logEvent(innovationId: number, kind: EventKind, { note, author = "system" }: { note?: string; author?: string } = {}) {
  await db().insert(event).values({ innovationId, kind, note, author })
}

export async function setStatus(innovationId: number, status: InnovationStatus, { note, author = "analityk" }: { note?: string; author?: string } = {}) {
  await db().update(innovation).set({ status, updatedAt: new Date() }).where(eq(innovation.id, innovationId))
  if (status !== "nowa") await logEvent(innovationId, status, { note, author })
}
