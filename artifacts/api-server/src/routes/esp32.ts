import { Router, type IRouter } from "express";
import { setEsp32Ip, clearEsp32Ip, getEsp32Status, pingEsp32 } from "../lib/esp32";

const router: IRouter = Router();

router.post("/esp32/configure", async (req, res) => {
  const { ip } = req.body as { ip?: string };
  if (!ip || typeof ip !== "string" || ip.trim() === "") {
    res.status(400).json({ error: "IP address is required" });
    return;
  }
  setEsp32Ip(ip);
  const reachable = await pingEsp32();
  res.json({ configured: true, ip: ip.trim(), connected: reachable });
});

router.delete("/esp32/configure", (_req, res) => {
  clearEsp32Ip();
  res.json({ configured: false });
});

router.get("/esp32/status", async (_req, res) => {
  const status = getEsp32Status();
  if (status.ip) {
    await pingEsp32();
  }
  res.json(getEsp32Status());
});

export default router;
