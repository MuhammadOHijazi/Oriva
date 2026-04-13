import { db } from "@workspace/db";
import { pillsTable, pillHistoryTable } from "@workspace/db/schema";
import { eq, asc, sql } from "drizzle-orm";

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

export async function markPillTaken(id: number) {
  const updated = await db
    .update(pillsTable)
    .set({ done: true, updatedAt: new Date() })
    .where(eq(pillsTable.id, id))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Pill ${id} not found`);
  }

  const pill = updated[0]!;

  await db
    .insert(pillHistoryTable)
    .values({
      pillId: id,
      date: getTodayString(),
      scheduledTime: pill.scheduledTime,
      taken: true,
    })
    .onConflictDoUpdate({
      target: [pillHistoryTable.pillId, pillHistoryTable.date],
      set: { taken: true, createdAt: sql`now()` },
    });

  return pill;
}

export async function getEarliestDuePill() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);

  const pills = await db
    .select()
    .from(pillsTable)
    .orderBy(asc(pillsTable.scheduledTime));

  return pills.find((p) => !p.done && p.scheduledTime <= hhmm) ?? null;
}
