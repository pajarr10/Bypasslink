import { Router } from "express";
import { getRedis, isRedisReady } from "../lib/redis.js";

const router = Router();

function parseUA(ua) {
  if (!ua) return { browser: "Unknown", device: "Unknown", os: "Unknown" };

  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  if (/Mobile|Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = "Mobile";
  }
  if (/iPad|Tablet/i.test(ua)) {
    device = "Tablet";
  }

  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  if (/Edg\/\d+/i.test(ua)) browser = "Edge";
  else if (/Chrome\/\d+/i.test(ua)) browser = "Chrome";
  else if (/Safari\/\d+/i.test(ua) && /Version\/\d+/i.test(ua)) browser = "Safari";
  else if (/Firefox\/\d+/i.test(ua)) browser = "Firefox";
  else if (/Opera|OPR\/\d+/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung";

  return { browser, device, os };
}

function getCountry(req) {
  return req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    req.headers["x-geo-country"] ||
    "Unknown";
}

function getReferrer(req) {
  return req.body?.referrer || req.headers.referer || req.headers.referrer || "Direct";
}

router.post("/", async (req, res) => {
  try {
    const ua = req.headers["user-agent"] || "Unknown";
    const { browser, device, os } = parseUA(ua);
    const country = getCountry(req);
    const referrer = getReferrer(req);
    const page = req.body?.page || "/";
    const ipRaw = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ip = ipRaw.split(",")[0].trim();
    const timestamp = Date.now();
    const date = new Date().toISOString().split("T")[0];

    const visitor = {
      ip,
      browser,
      device,
      os,
      country,
      referrer,
      userAgent: ua,
      page,
      timestamp,
      lastActive: timestamp,
      date
    };

    if (isRedisReady()) {
      const redis = getRedis();
      const pipeline = redis.pipeline();
      pipeline.lpush("bipasunlok:visitors", JSON.stringify(visitor));
      pipeline.ltrim("bipasunlok:visitors", 0, 999);
      pipeline.incr("bipasunlok:visitor:count");
      pipeline.incr(`bipasunlok:visitor:${date}`);
      pipeline.sadd("bipasunlok:unique:visitors", `${ip}-${ua}-${country}`);
      const onlineId = `online-${ip}-${timestamp}`;
      pipeline.setex(`bipasunlok:online:${onlineId}`, 300, JSON.stringify(visitor));
      await pipeline.exec();
    }

    res.json({ status: true, message: "Visitor tracked" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

export default router;
