import type { MediaItem } from "@screenharbor/shared";

export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  TELEGRAM_BOT_TOKEN?: string;
}

const demoMedia: MediaItem[] = [
  {
    id: "the-wandering-earth-2",
    chineseTitle: "流浪地球 2",
    originalTitle: "流浪地球 2",
    englishTitle: "The Wandering Earth II",
    type: "movie",
    year: 2023,
    regions: ["中国大陆"],
    languages: ["普通话", "英语"],
    posterUrl: "https://image.tmdb.org/t/p/w500/pR858ihc6Ls9xohpdRJVjV787ml.jpg",
    overview: "太阳危机将至，人类启动行星发动机计划，在宏大的灾难叙事里追问技术、牺牲和文明延续。",
    tags: ["科幻", "灾难", "太空"],
    averageRating: 8.3,
    reviewCount: 1524,
    resourceCount: 18,
    telegraphUrl: "https://telegra.ph/"
  }
];

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: jsonHeaders });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, service: "screenharbor-api" });
    }

    if (url.pathname === "/auth/telegram" && request.method === "POST") {
      const initData = request.headers.get("X-Telegram-Init-Data") ?? "";
      const isValid = await verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
      return json({ ok: isValid, mode: env.TELEGRAM_BOT_TOKEN ? "verified" : "development" });
    }

    if (url.pathname === "/media" && request.method === "GET") {
      return json({ items: demoMedia });
    }

    const mediaMatch = url.pathname.match(/^\/media\/([^/]+)$/);
    if (mediaMatch && request.method === "GET") {
      const item = demoMedia.find((media) => media.id === mediaMatch[1]);
      return item ? json({ item }) : json({ error: "Media item not found" }, 404);
    }

    return json({ error: "Route not found" }, 404);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders
  });
}

async function verifyTelegramInitData(initData: string, botToken?: string) {
  if (!botToken) {
    return Boolean(initData);
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return false;
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const tokenKey = await crypto.subtle.sign("HMAC", secretKey, new TextEncoder().encode(botToken));
  const dataKey = await crypto.subtle.importKey("raw", tokenKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", dataKey, new TextEncoder().encode(dataCheckString));
  const calculatedHash = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return timingSafeEqual(calculatedHash, hash);
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}
