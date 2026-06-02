import type { MediaItem, MediaType, ResourcePost, ResourceType, ResourceVisibility } from "@screenharbor/shared";

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

const demoResources: ResourcePost[] = [
  {
    id: "res-001",
    mediaItemId: "frieren",
    title: "WEB-DL 1080p 简繁字幕合集",
    type: "subtitle",
    visibility: "login_only",
    requiredPoints: 0,
    status: "published"
  },
  {
    id: "res-002",
    mediaItemId: "the-wandering-earth-2",
    title: "蓝光原盘版本说明",
    type: "cloud_drive",
    visibility: "points_only",
    requiredPoints: 20,
    status: "pending"
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
      const items = await listMediaItems(env);
      return json({ items });
    }

    const mediaMatch = url.pathname.match(/^\/media\/([^/]+)$/);
    if (mediaMatch && request.method === "GET") {
      const item = await getMediaItem(env, mediaMatch[1]);
      return item ? json({ item }) : json({ error: "Media item not found" }, 404);
    }

    if (url.pathname === "/resources/latest" && request.method === "GET") {
      const items = await listLatestResources(env);
      return json({ items });
    }

    return json({ error: "Route not found" }, 404);
  }
};

interface MediaRow {
  id: string;
  chinese_title: string;
  original_title: string | null;
  english_title: string | null;
  media_type: string;
  release_year: number | null;
  regions: string;
  languages: string;
  poster_object_key: string | null;
  overview: string;
  average_rating: number | null;
  review_count: number;
  resource_count: number;
  telegraph_url: string | null;
  tags: string | null;
}

interface ResourceRow {
  id: string;
  media_item_id: string;
  title: string;
  resource_type: string;
  visibility: string;
  required_points: number;
  status: string;
}

async function listMediaItems(env: Env): Promise<MediaItem[]> {
  try {
    const result = await env.DB.prepare(
      `SELECT
        media_items.*,
        COALESCE(json_group_array(tags.name) FILTER (WHERE tags.name IS NOT NULL), '[]') AS tags
      FROM media_items
      LEFT JOIN media_item_tags ON media_item_tags.media_item_id = media_items.id
      LEFT JOIN tags ON tags.id = media_item_tags.tag_id
      GROUP BY media_items.id
      ORDER BY media_items.updated_at DESC
      LIMIT 24`
    ).all<MediaRow>();

    const items = result.results.map(mapMediaRow);
    return items.length > 0 ? items : demoMedia;
  } catch {
    return demoMedia;
  }
}

async function getMediaItem(env: Env, id: string): Promise<MediaItem | undefined> {
  try {
    const row = await env.DB.prepare(
      `SELECT
        media_items.*,
        COALESCE(json_group_array(tags.name) FILTER (WHERE tags.name IS NOT NULL), '[]') AS tags
      FROM media_items
      LEFT JOIN media_item_tags ON media_item_tags.media_item_id = media_items.id
      LEFT JOIN tags ON tags.id = media_item_tags.tag_id
      WHERE media_items.id = ?
      GROUP BY media_items.id`
    )
      .bind(id)
      .first<MediaRow>();

    return row ? mapMediaRow(row) : demoMedia.find((media) => media.id === id);
  } catch {
    return demoMedia.find((media) => media.id === id);
  }
}

async function listLatestResources(env: Env): Promise<ResourcePost[]> {
  try {
    const result = await env.DB.prepare(
      `SELECT
        id,
        media_item_id,
        title,
        resource_type,
        visibility,
        required_points,
        status
      FROM resource_posts
      WHERE status IN ('pending', 'published')
      ORDER BY created_at DESC
      LIMIT 12`
    ).all<ResourceRow>();

    const items = result.results.map(mapResourceRow);
    return items.length > 0 ? items : demoResources;
  } catch {
    return demoResources;
  }
}

function mapMediaRow(row: MediaRow): MediaItem {
  return {
    id: row.id,
    chineseTitle: row.chinese_title,
    originalTitle: row.original_title ?? undefined,
    englishTitle: row.english_title ?? undefined,
    type: row.media_type as MediaType,
    year: row.release_year ?? 0,
    regions: parseJsonArray(row.regions),
    languages: parseJsonArray(row.languages),
    posterUrl: row.poster_object_key ?? undefined,
    overview: row.overview,
    tags: parseJsonArray(row.tags ?? "[]"),
    averageRating: row.average_rating ?? undefined,
    reviewCount: row.review_count,
    resourceCount: row.resource_count,
    telegraphUrl: row.telegraph_url ?? undefined
  };
}

function mapResourceRow(row: ResourceRow): ResourcePost {
  return {
    id: row.id,
    mediaItemId: row.media_item_id,
    title: row.title,
    type: row.resource_type as ResourceType,
    visibility: row.visibility as ResourceVisibility,
    requiredPoints: row.required_points,
    status: row.status as ResourcePost["status"]
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

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
