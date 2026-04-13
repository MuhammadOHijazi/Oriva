import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientTable } from "@workspace/db/schema";
import { SavePatientBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/patient", async (req, res) => {
  try {
    const rows = await db.select().from(patientTable).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "No patient found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get patient");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/patient", async (req, res) => {
  try {
    const body = SavePatientBody.parse(req.body);
    const existing = await db.select().from(patientTable).limit(1);
    if (existing.length > 0) {
      const updated = await db
        .update(patientTable)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(patientTable.id, existing[0].id))
        .returning();
      res.json(updated[0]);
    } else {
      const created = await db.insert(patientTable).values(body).returning();
      res.json(created[0]);
    }
  } catch (err) {
    req.log.error({ err }, "Failed to save patient");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
