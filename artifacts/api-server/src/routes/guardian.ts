import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { guardianTable } from "@workspace/db/schema";
import { SaveGuardianBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/guardian", async (req, res) => {
  try {
    const rows = await db.select().from(guardianTable).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "No guardian found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get guardian");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/guardian", async (req, res) => {
  try {
    const body = SaveGuardianBody.parse(req.body);
    const existing = await db.select().from(guardianTable).limit(1);
    if (existing.length > 0) {
      const updated = await db
        .update(guardianTable)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(guardianTable.id, existing[0].id))
        .returning();
      res.json(updated[0]);
    } else {
      const created = await db.insert(guardianTable).values(body).returning();
      res.json(created[0]);
    }
  } catch (err) {
    req.log.error({ err }, "Failed to save guardian");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
