import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pillHistoryTable, guardianTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/alert/consecutive-missed", async (req, res) => {
  try {
    const history = await db
      .select()
      .from(pillHistoryTable)
      .orderBy(desc(pillHistoryTable.date), desc(pillHistoryTable.scheduledTime))
      .limit(3);

    if (history.length < 3) {
      res.json({ shouldAlert: false });
      return;
    }

    const allMissed = history.every((h) => !h.taken);
    if (!allMissed) {
      res.json({ shouldAlert: false });
      return;
    }

    const guardians = await db.select().from(guardianTable).limit(1);
    const guardian = guardians[0] ?? null;

    res.json({ shouldAlert: true, guardian });
  } catch (err) {
    req.log.error({ err }, "Failed to check consecutive missed doses");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
