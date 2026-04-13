import { db } from "@workspace/db";
import { pillsTable, pillHistoryTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

function getDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split("T")[0]!;
}

async function midnightReset() {
  try {
    const yesterday = getDateString(1);
    const pills = await db.select().from(pillsTable);

    for (const pill of pills) {
      if (!pill.done) {
        await db
          .insert(pillHistoryTable)
          .values({ pillId: pill.id, date: yesterday, scheduledTime: pill.scheduledTime, taken: false })
          .onConflictDoNothing();
      }
      await db
        .update(pillsTable)
        .set({ done: false, updatedAt: new Date() })
        .where(eq(pillsTable.id, pill.id));
    }

    logger.info({ yesterday }, "Midnight reset complete");
  } catch (err) {
    logger.error({ err }, "Midnight reset failed");
  }
}

function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();
  setTimeout(() => {
    midnightReset();
    setInterval(midnightReset, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
  logger.info({ msUntilMidnight }, "Midnight reset scheduled");
}

export function startAlarmScheduler() {
  scheduleMidnightReset();
  logger.info("Alarm scheduler started (software-only mode)");
}
