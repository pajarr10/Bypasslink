import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;

if (url && token) {
  try {
    redis = new Redis({ url, token });
  } catch (error) {
    console.error("[Redis] Failed to initialize:", error.message);
  }
}

export function getRedis() {
  return redis;
}

export function isRedisReady() {
  return !!redis;
}

export async function testRedis() {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
