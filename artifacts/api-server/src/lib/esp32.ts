import { logger } from "./logger";

let esp32Ip: string | null = null;
let lastConnected = false;

export function setEsp32Ip(ip: string) {
  esp32Ip = ip.trim();
}

export function clearEsp32Ip() {
  esp32Ip = null;
  lastConnected = false;
}

export function getEsp32Ip(): string | null {
  return esp32Ip;
}

export function getEsp32Status() {
  return { connected: lastConnected, ip: esp32Ip };
}

export async function pingEsp32(): Promise<boolean> {
  if (!esp32Ip) return false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://${esp32Ip}/ping`, { signal: controller.signal });
    clearTimeout(id);
    lastConnected = res.ok;
    logger.info({ ip: esp32Ip, ok: res.ok }, "ESP32 ping");
    return res.ok;
  } catch {
    lastConnected = false;
    return false;
  }
}

export async function sendToEsp32(message: string): Promise<boolean> {
  if (!esp32Ip) {
    logger.warn({ message }, "ESP32 not configured — command not sent");
    return false;
  }
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://${esp32Ip}/command`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: message,
      signal: controller.signal,
    });
    clearTimeout(id);
    lastConnected = true;
    logger.info({ ip: esp32Ip, message, status: res.status }, "Sent command to ESP32");
    return res.ok;
  } catch (err) {
    lastConnected = false;
    logger.warn({ ip: esp32Ip, message, err }, "Failed to send command to ESP32");
    return false;
  }
}
