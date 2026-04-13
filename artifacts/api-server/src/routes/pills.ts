import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pillsTable, pillHistoryTable } from "@workspace/db/schema";
import { AddPillBody, UpdatePillBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { markPillTaken } from "../lib/pills-service";

const router: IRouter = Router();

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

router.get("/pills", async (req, res) => {
  try {
    const today = getTodayString();
    const rows = await db.select().from(pillsTable).orderBy(pillsTable.scheduledTime);
    const todayHistory = await db.select().from(pillHistoryTable).where(eq(pillHistoryTable.date, today));
    const historyMap = new Map(todayHistory.map((h) => [h.pillId, h.taken]));
    const result = rows.map((pill) => ({
      ...pill,
      takenToday: historyMap.get(pill.id) === true,
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get pills");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pills", async (req, res) => {
  try {
    const body = AddPillBody.parse(req.body);
    const created = await db.insert(pillsTable).values(body).returning();
    const pill = created[0]!;
    res.status(201).json({ ...pill, takenToday: false });
  } catch (err) {
    req.log.error({ err }, "Failed to add pill");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/pills/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = UpdatePillBody.parse(req.body);
    const updated = await db
      .update(pillsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(pillsTable.id, id))
      .returning();
    if (updated.length === 0) {
      res.status(404).json({ error: "Pill not found" });
      return;
    }
    const today = getTodayString();
    const todayHistory = await db.select().from(pillHistoryTable)
      .where(eq(pillHistoryTable.date, today));
    const takenToday = todayHistory.some((h) => h.pillId === id && h.taken);
    res.json({ ...updated[0]!, takenToday });
  } catch (err) {
    req.log.error({ err }, "Failed to update pill");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/pills/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await db.delete(pillsTable).where(eq(pillsTable.id, id)).returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Pill not found" });
      return;
    }
    res.json({ message: "Pill deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete pill");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pills/:id/taken", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pill = await markPillTaken(id);
    res.json({ ...pill, takenToday: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("not found")) {
      res.status(404).json({ error: "Pill not found" });
      return;
    }
    req.log.error({ err }, "Failed to mark pill as taken");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pills/:id/missed", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const today = getTodayString();

    const pill = await db.select().from(pillsTable).where(eq(pillsTable.id, id));
    if (pill.length === 0) {
      res.status(404).json({ error: "Pill not found" });
      return;
    }

    const todayHistory = await db.select().from(pillHistoryTable)
      .where(eq(pillHistoryTable.date, today));
    const alreadyTaken = todayHistory.some((h) => h.pillId === id && h.taken);

    if (alreadyTaken) {
      res.json({ message: "Pill already taken today, not marking as missed" });
      return;
    }

    await db
      .insert(pillHistoryTable)
      .values({ pillId: id, date: today, scheduledTime: pill[0]!.scheduledTime, taken: false })
      .onConflictDoNothing();
    res.json({ message: "Pill marked as missed" });
  } catch (err) {
    req.log.error({ err }, "Failed to mark pill as missed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pills/:id/reset", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await db
      .update(pillsTable)
      .set({ done: false, updatedAt: new Date() })
      .where(eq(pillsTable.id, id))
      .returning();
    if (updated.length === 0) {
      res.status(404).json({ error: "Pill not found" });
      return;
    }
    res.json({ ...updated[0]!, takenToday: false });
  } catch (err) {
    req.log.error({ err }, "Failed to reset pill");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
