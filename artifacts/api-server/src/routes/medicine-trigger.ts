import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pillsTable } from "@workspace/db/schema";
import { asc } from "drizzle-orm";
import { markPillTaken } from "../lib/pills-service";
import { sendToEsp32 } from "../lib/esp32";

const router: IRouter = Router();

router.post("/take-medicine", async (req, res) => {
  try {
    const { medicineNumber } = req.body as { medicineNumber?: number };

    if (typeof medicineNumber !== "number" || medicineNumber < 1) {
      res.status(400).json({ error: "Invalid medicine number" });
      return;
    }

    const pills = await db
      .select()
      .from(pillsTable)
      .orderBy(asc(pillsTable.scheduledTime));

    const pill = pills[medicineNumber - 1];

    if (!pill) {
      res.status(400).json({ error: `No medicine found at position ${medicineNumber}` });
      return;
    }

    const message = `START|${pill.scheduledTime}|${medicineNumber}`;
    req.log.info({ message }, "Medicine trigger");

    await markPillTaken(pill.id);

    const esp32Sent = await sendToEsp32(message);

    res.json({
      sent: true,
      medicine: medicineNumber,
      time: pill.scheduledTime,
      name: pill.name,
      esp32: esp32Sent,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger medicine");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/status", (req, res) => {
  req.log.info({ status: req.body.status }, "Medicine status update");
  res.sendStatus(200);
});

export default router;
