import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pillsTable, pillHistoryTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function getDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split("T")[0]!;
}

function getDayAbbrev(dateStr: string): string {
  return DAY_ABBREVS[new Date(dateStr + "T12:00:00").getDay()] ?? "Mon";
}

function getCurrentHHMM(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function pillScheduledForDay(pill: { daysOfWeek: string }, dayAbbrev: string): boolean {
  return pill.daysOfWeek.split(",").map((d) => d.trim()).includes(dayAbbrev);
}

router.get("/adherence/weekly", async (req, res) => {
  try {
    const today = getDateString(0);
    const todayAbbrev = getDayAbbrev(today);
    const hhmm = getCurrentHHMM();
    const currentMins = toMins(hhmm);

    const pills = await db.select().from(pillsTable);

    const todayHistory = await db.select().from(pillHistoryTable).where(eq(pillHistoryTable.date, today));
    const takenTodaySet = new Set(todayHistory.filter((h) => h.taken).map((h) => h.pillId));

    for (const pill of pills) {
      if (!pillScheduledForDay(pill, todayAbbrev)) continue;
      if (takenTodaySet.has(pill.id)) continue;
      if (toMins(pill.scheduledTime) > currentMins) continue;

      await db
        .insert(pillHistoryTable)
        .values({ pillId: pill.id, date: today, scheduledTime: pill.scheduledTime, taken: false })
        .onConflictDoNothing();
    }

    const last7 = Array.from({ length: 7 }, (_, i) => getDateString(i));

    const history = await db.select().from(pillHistoryTable);
    const relevant = history.filter((h) => last7.includes(h.date));

    const total = relevant.length;
    const taken = relevant.filter((h) => h.taken).length;
    const percent = total === 0 ? 100 : Math.round((taken / total) * 100);
    const earlyMode = percent < 60;

    const dailyBreakdown = last7.map((date) => {
      const dayRecords = relevant.filter((h) => h.date === date);
      const dayTaken = dayRecords.filter((h) => h.taken).length;
      return {
        date,
        total: dayRecords.length,
        taken: dayTaken,
        percent: dayRecords.length === 0 ? null : Math.round((dayTaken / dayRecords.length) * 100),
      };
    });

    res.json({ percent, total, taken, earlyMode, dailyBreakdown });
  } catch (err) {
    req.log.error({ err }, "Failed to get weekly adherence");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
