import { Router } from "express";
import { bypass } from "../lib/bypassunlock.js";
import { getRedis, isRedisReady } from "../lib/redis.js";

const router = Router();

router.post("/", async (req, res) => {
  const startTime = Date.now();
  const { url } = req.body;

  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      status: false,
      result: null,
      message: "URL is required"
    });
  }

  const trimmedUrl = url.trim();
  const logEntry = {
    endpoint: "/api/bypass",
    method: req.method,
    statusCode: 200,
    error: null,
    timestamp: startTime
  };

  try {
    const result = await bypass(trimmedUrl);
    const duration = Date.now() - startTime;

    const bypassRecord = {
      input: trimmedUrl,
      result: result.Result_url,
      status: true,
      duration,
      timestamp: startTime,
      date: new Date().toISOString().split("T")[0]
    };

    if (isRedisReady()) {
      const redis = getRedis();
      const pipeline = redis.pipeline();
      pipeline.lpush("bipasunlok:bypass", JSON.stringify(bypassRecord));
      pipeline.ltrim("bipasunlok:bypass", 0, 999);
      pipeline.incr("bipasunlok:requests:total");
      pipeline.incr("bipasunlok:requests:success");
      pipeline.lpush("bipasunlok:response:times", String(duration));
      pipeline.ltrim("bipasunlok:response:times", 0, 99);
      pipeline.lpush("bipasunlok:logs", JSON.stringify(logEntry));
      pipeline.ltrim("bipasunlok:logs", 0, 499);
      await pipeline.exec();
    }

    res.json({
      status: true,
      result: result.Result_url
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logEntry.statusCode = error.code || 500;
    logEntry.error = error.message || String(error);

    const bypassRecord = {
      input: trimmedUrl,
      result: null,
      status: false,
      duration,
      error: error.message || String(error),
      timestamp: startTime,
      date: new Date().toISOString().split("T")[0]
    };

    if (isRedisReady()) {
      const redis = getRedis();
      const pipeline = redis.pipeline();
      pipeline.lpush("bipasunlok:bypass", JSON.stringify(bypassRecord));
      pipeline.ltrim("bipasunlok:bypass", 0, 999);
      pipeline.incr("bipasunlok:requests:total");
      pipeline.incr("bipasunlok:requests:failed");
      pipeline.lpush("bipasunlok:logs", JSON.stringify(logEntry));
      pipeline.ltrim("bipasunlok:logs", 0, 499);
      await pipeline.exec();
    }

    res.status(error.code || 500).json({
      status: false,
      result: null,
      message: error.message || "Bypass failed"
    });
  }
});

export default router;
