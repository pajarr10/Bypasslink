import { Router } from "express";
import { getRedis, isRedisReady } from "../lib/redis.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    if (!isRedisReady()) {
      return res.json({
        status: false,
        message: "Redis not configured",
        data: {
          visitor: { total: 0, today: 0, yesterday: 0, unique: 0, online: 0 },
          request: { total: 0, success: 0, failed: 0, successRate: 0, failedRate: 0, avgResponseTime: 0 },
          charts: { browsers: [], devices: [], os: [], countries: [], referrers: [], pages: [] },
          recentVisitors: [],
          recentBypass: [],
          recentLogs: []
        }
      });
    }

    const redis = getRedis();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const [
      totalVisitors,
      todayVisitors,
      yesterdayVisitors,
      uniqueVisitors,
      totalRequests,
      successCount,
      failedCount,
      recentVisitors,
      bypassHistory,
      logs,
      onlineKeys
    ] = await Promise.all([
      redis.get("bipasunlok:visitor:count").then(v => parseInt(v || "0", 10)),
      redis.get(`bipasunlok:visitor:${today}`).then(v => parseInt(v || "0", 10)),
      redis.get(`bipasunlok:visitor:${yesterday}`).then(v => parseInt(v || "0", 10)),
      redis.scard("bipasunlok:unique:visitors").then(v => parseInt(v || "0", 10)),
      redis.get("bipasunlok:requests:total").then(v => parseInt(v || "0", 10)),
      redis.get("bipasunlok:requests:success").then(v => parseInt(v || "0", 10)),
      redis.get("bipasunlok:requests:failed").then(v => parseInt(v || "0", 10)),
      redis.lrange("bipasunlok:visitors", 0, 49).then(list => list.map(safeJsonParse)),
      redis.lrange("bipasunlok:bypass", 0, 49).then(list => list.map(safeJsonParse)),
      redis.lrange("bipasunlok:logs", 0, 49).then(list => list.map(safeJsonParse)),
      redis.keys("bipasunlok:online:*")
    ]);

    const responseTimes = await redis.lrange("bipasunlok:response:times", 0, -1);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + parseInt(b || "0", 10), 0) / responseTimes.length)
      : 0;

    const successRate = totalRequests > 0 ? Number(((successCount / totalRequests) * 100).toFixed(1)) : 0;
    const failedRate = totalRequests > 0 ? Number(((failedCount / totalRequests) * 100).toFixed(1)) : 0;

    const allVisitors = await redis.lrange("bipasunlok:visitors", 0, -1).then(list => list.map(safeJsonParse));

    function countBy(key, limit = 8) {
      const counts = {};
      allVisitors.forEach(v => {
        if (v && v[key]) counts[v[key]] = (counts[v[key]] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, value]) => ({ name, value }));
    }

    const data = {
      visitor: {
        total: totalVisitors,
        today: todayVisitors,
        yesterday: yesterdayVisitors,
        unique: uniqueVisitors,
        online: onlineKeys.length
      },
      request: {
        total: totalRequests,
        success: successCount,
        failed: failedCount,
        successRate,
        failedRate,
        avgResponseTime
      },
      charts: {
        browsers: countBy("browser"),
        devices: countBy("device"),
        os: countBy("os"),
        countries: countBy("country"),
        referrers: countBy("referrer"),
        pages: countBy("page")
      },
      recentVisitors,
      recentBypass: bypassHistory,
      recentLogs: logs
    };

    res.json({ status: true, data });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}

export default router;
