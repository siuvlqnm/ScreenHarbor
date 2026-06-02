import {
  resourceTypes,
  resourceVisibilities,
  watchStatuses,
  type Report,
  type MediaItem,
  type MediaType,
  type ResourcePost,
  type ResourceType,
  type ResourceVisibility,
  type UserReview,
  type UserMediaStatus,
  type WatchStatus
} from "@screenharbor/shared";

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

    if (url.pathname === "/admin/resources/pending" && request.method === "GET") {
      await getCurrentUser(request, env);
      const items = await listModerationResources(env);
      return json({ items });
    }

    const moderateResourceMatch = url.pathname.match(/^\/admin\/resources\/([^/]+)\/moderate$/);
    if (moderateResourceMatch && request.method === "POST") {
      const user = await getCurrentUser(request, env);
      const body = await readJson<{ action?: "publish" | "reject" | "hide"; note?: string }>(request);

      if (!body.action || !["publish", "reject", "hide"].includes(body.action)) {
        return json({ error: "Invalid moderation action" }, 400);
      }

      const resource = await moderateResource(env, user.id, moderateResourceMatch[1], body.action, body.note);
      return json({ resource });
    }

    if (url.pathname === "/reports" && request.method === "POST") {
      const user = await getCurrentUser(request, env);
      const body = await readJson<{ targetType?: Report["targetType"]; targetId?: string; reason?: string }>(request);
      const reason = trimOptional(body.reason);

      if (!isReportTargetType(body.targetType) || !body.targetId || !reason) {
        return json({ error: "Invalid report payload" }, 400);
      }

      const report = await createReport(env, user.id, body.targetType, body.targetId, reason);
      return json({ report }, 201);
    }

    const statusMatch = url.pathname.match(/^\/media\/([^/]+)\/status$/);
    if (statusMatch && request.method === "GET") {
      const user = await getCurrentUser(request, env);
      const status = await getUserMediaStatus(env, user.id, statusMatch[1]);
      return json({ status });
    }

    if (statusMatch && request.method === "POST") {
      const user = await getCurrentUser(request, env);
      const body = await readJson<{ status?: WatchStatus; rating?: number; progress?: string; note?: string }>(request);

      if (!body.status || !isWatchStatus(body.status)) {
        return json({ error: "Invalid watch status" }, 400);
      }

      const status = await upsertUserMediaStatus(env, user.id, statusMatch[1], {
        note: body.note,
        progress: body.progress,
        rating: body.rating,
        status: body.status
      });
      return json({ status });
    }

    const mediaResourcesMatch = url.pathname.match(/^\/media\/([^/]+)\/resources$/);
    if (mediaResourcesMatch && request.method === "GET") {
      const items = await listMediaResources(env, mediaResourcesMatch[1]);
      return json({ items });
    }

    if (mediaResourcesMatch && request.method === "POST") {
      const user = await getCurrentUser(request, env);
      const body = await readJson<{
        title?: string;
        type?: ResourceType;
        url?: string;
        versionNote?: string;
        fileSize?: string;
        resolution?: string;
        subtitleNote?: string;
        visibility?: ResourceVisibility;
        requiredPoints?: number;
      }>(request);

      if (!trimOptional(body.title) || !body.type || !isResourceType(body.type) || !trimOptional(body.url)) {
        return json({ error: "Invalid resource payload" }, 400);
      }

      const resource = await createResourcePost(env, user.id, mediaResourcesMatch[1], body);
      return json({ resource }, 201);
    }

    const mediaReviewsMatch = url.pathname.match(/^\/media\/([^/]+)\/reviews$/);
    if (mediaReviewsMatch && request.method === "GET") {
      const items = await listMediaReviews(env, mediaReviewsMatch[1]);
      return json({ items });
    }

    if (mediaReviewsMatch && request.method === "POST") {
      const user = await getCurrentUser(request, env);
      const body = await readJson<{ body?: string; rating?: number; containsSpoiler?: boolean }>(request);

      if (!trimOptional(body.body)) {
        return json({ error: "Review body is required" }, 400);
      }

      const review = await createReview(env, user.id, mediaReviewsMatch[1], body);
      return json({ review }, 201);
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
  url: string;
  version_note: string | null;
  file_size: string | null;
  resolution: string | null;
  subtitle_note: string | null;
  visibility: string;
  required_points: number;
  status: string;
  created_at: string;
}

interface UserRow {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
  role: string;
}

interface UserMediaStatusRow {
  id: string;
  user_id: string;
  media_item_id: string;
  status: string;
  rating: number | null;
  progress: string | null;
  note: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface UserReviewRow {
  id: string;
  user_id: string;
  media_item_id: string;
  display_name: string | null;
  rating: number | null;
  body: string;
  contains_spoiler: number;
  like_count: number;
  created_at: string;
}

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
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
        url,
        version_note,
        file_size,
        resolution,
        subtitle_note,
        visibility,
        required_points,
        status,
        created_at
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
    url: row.url,
    versionNote: row.version_note ?? undefined,
    fileSize: row.file_size ?? undefined,
    resolution: row.resolution ?? undefined,
    subtitleNote: row.subtitle_note ?? undefined,
    visibility: row.visibility as ResourceVisibility,
    requiredPoints: row.required_points,
    status: row.status as ResourcePost["status"],
    createdAt: row.created_at
  };
}

async function listMediaResources(env: Env, mediaItemId: string): Promise<ResourcePost[]> {
  const result = await env.DB.prepare(
    `SELECT
      id,
      media_item_id,
      title,
      resource_type,
      url,
      version_note,
      file_size,
      resolution,
      subtitle_note,
      visibility,
      required_points,
      status,
      created_at
    FROM resource_posts
    WHERE media_item_id = ? AND status IN ('published', 'pending')
    ORDER BY created_at DESC`
  )
    .bind(mediaItemId)
    .all<ResourceRow>();

  return result.results.map(mapResourceRow);
}

async function listModerationResources(env: Env): Promise<ResourcePost[]> {
  const result = await env.DB.prepare(
    `SELECT
      id,
      media_item_id,
      title,
      resource_type,
      url,
      version_note,
      file_size,
      resolution,
      subtitle_note,
      visibility,
      required_points,
      status,
      created_at
    FROM resource_posts
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 50`
  ).all<ResourceRow>();

  return result.results.map(mapResourceRow);
}

async function createResourcePost(
  env: Env,
  userId: string,
  mediaItemId: string,
  input: {
    title?: string;
    type?: ResourceType;
    url?: string;
    versionNote?: string;
    fileSize?: string;
    resolution?: string;
    subtitleNote?: string;
    visibility?: ResourceVisibility;
    requiredPoints?: number;
  }
): Promise<ResourcePost> {
  const id = crypto.randomUUID();
  const visibility = input.visibility && isResourceVisibility(input.visibility) ? input.visibility : "review_only";
  const requiredPoints = Math.max(0, Math.trunc(input.requiredPoints ?? 0));
  const priceType = requiredPoints > 0 ? "points" : "free";

  await env.DB.prepare(
    `INSERT INTO resource_posts (
      id,
      media_item_id,
      author_user_id,
      title,
      resource_type,
      url,
      version_note,
      file_size,
      resolution,
      subtitle_note,
      visibility,
      price_type,
      required_points,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
  )
    .bind(
      id,
      mediaItemId,
      userId,
      trimOptional(input.title),
      input.type,
      trimOptional(input.url),
      trimOptional(input.versionNote),
      trimOptional(input.fileSize),
      trimOptional(input.resolution),
      trimOptional(input.subtitleNote),
      visibility,
      priceType,
      requiredPoints
    )
    .run();

  await refreshMediaResourceCount(env, mediaItemId);

  const resource = await getResourcePost(env, id);
  if (!resource) {
    throw new Error("Unable to create resource post");
  }

  return resource;
}

async function moderateResource(
  env: Env,
  moderatorUserId: string,
  resourceId: string,
  action: "publish" | "reject" | "hide",
  note?: string
): Promise<ResourcePost | null> {
  const statusByAction = {
    hide: "hidden",
    publish: "published",
    reject: "rejected"
  } as const;

  await env.DB.prepare("UPDATE resource_posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(statusByAction[action], resourceId)
    .run();

  await env.DB.prepare(
    `INSERT INTO moderation_logs (
      id,
      moderator_user_id,
      target_type,
      target_id,
      action,
      note
    ) VALUES (?, ?, 'resource', ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), moderatorUserId, resourceId, action, trimOptional(note))
    .run();

  const resource = await getResourcePost(env, resourceId);
  if (resource) {
    await refreshMediaResourceCount(env, resource.mediaItemId);
  }

  return resource;
}

async function getResourcePost(env: Env, id: string): Promise<ResourcePost | null> {
  const row = await env.DB.prepare(
    `SELECT
      id,
      media_item_id,
      title,
      resource_type,
      url,
      version_note,
      file_size,
      resolution,
      subtitle_note,
      visibility,
      required_points,
      status,
      created_at
    FROM resource_posts
    WHERE id = ?`
  )
    .bind(id)
    .first<ResourceRow>();

  return row ? mapResourceRow(row) : null;
}

async function refreshMediaResourceCount(env: Env, mediaItemId: string) {
  await env.DB.prepare(
    `UPDATE media_items
    SET resource_count = (
      SELECT COUNT(*)
      FROM resource_posts
      WHERE media_item_id = ? AND status = 'published'
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  )
    .bind(mediaItemId, mediaItemId)
    .run();
}

async function listMediaReviews(env: Env, mediaItemId: string): Promise<UserReview[]> {
  const result = await env.DB.prepare(
    `SELECT
      user_reviews.id,
      user_reviews.user_id,
      user_reviews.media_item_id,
      users.display_name,
      user_reviews.rating,
      user_reviews.body,
      user_reviews.contains_spoiler,
      user_reviews.like_count,
      user_reviews.created_at
    FROM user_reviews
    LEFT JOIN users ON users.id = user_reviews.user_id
    WHERE user_reviews.media_item_id = ?
    ORDER BY user_reviews.created_at DESC
    LIMIT 24`
  )
    .bind(mediaItemId)
    .all<UserReviewRow>();

  return result.results.map(mapReviewRow);
}

async function createReview(
  env: Env,
  userId: string,
  mediaItemId: string,
  input: { body?: string; rating?: number; containsSpoiler?: boolean }
): Promise<UserReview> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO user_reviews (
      id,
      user_id,
      media_item_id,
      rating,
      body,
      contains_spoiler
    ) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, userId, mediaItemId, normalizeRating(input.rating), trimOptional(input.body), input.containsSpoiler ? 1 : 0)
    .run();

  await refreshMediaReviewSummary(env, mediaItemId);

  const review = await env.DB.prepare(
    `SELECT
      user_reviews.id,
      user_reviews.user_id,
      user_reviews.media_item_id,
      users.display_name,
      user_reviews.rating,
      user_reviews.body,
      user_reviews.contains_spoiler,
      user_reviews.like_count,
      user_reviews.created_at
    FROM user_reviews
    LEFT JOIN users ON users.id = user_reviews.user_id
    WHERE user_reviews.id = ?`
  )
    .bind(id)
    .first<UserReviewRow>();

  if (!review) {
    throw new Error("Unable to create review");
  }

  return mapReviewRow(review);
}

async function refreshMediaReviewSummary(env: Env, mediaItemId: string) {
  await env.DB.prepare(
    `UPDATE media_items
    SET
      review_count = (SELECT COUNT(*) FROM user_reviews WHERE media_item_id = ?),
      average_rating = (SELECT AVG(rating) FROM user_reviews WHERE media_item_id = ? AND rating IS NOT NULL),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  )
    .bind(mediaItemId, mediaItemId, mediaItemId)
    .run();
}

function mapReviewRow(row: UserReviewRow): UserReview {
  return {
    id: row.id,
    userId: row.user_id,
    mediaItemId: row.media_item_id,
    displayName: row.display_name ?? "匿名用户",
    rating: row.rating ?? undefined,
    body: row.body,
    containsSpoiler: row.contains_spoiler === 1,
    likeCount: row.like_count,
    createdAt: row.created_at
  };
}

async function createReport(
  env: Env,
  reporterUserId: string,
  targetType: Report["targetType"],
  targetId: string,
  reason: string
): Promise<Report> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO reports (
      id,
      reporter_user_id,
      target_type,
      target_id,
      reason
    ) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, reporterUserId, targetType, targetId, reason.trim())
    .run();

  const row = await env.DB.prepare("SELECT id, target_type, target_id, reason, status, created_at FROM reports WHERE id = ?")
    .bind(id)
    .first<ReportRow>();

  if (!row) {
    throw new Error("Unable to create report");
  }

  return mapReportRow(row);
}

function mapReportRow(row: ReportRow): Report {
  return {
    id: row.id,
    targetType: row.target_type as Report["targetType"],
    targetId: row.target_id,
    reason: row.reason,
    status: row.status as Report["status"],
    createdAt: row.created_at
  };
}

async function getCurrentUser(request: Request, env: Env): Promise<UserRow> {
  const initData = request.headers.get("X-Telegram-Init-Data") ?? "";
  const telegramUser = parseTelegramUser(initData);

  if (!telegramUser) {
    const demoUser = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind("demo-contributor").first<UserRow>();

    if (demoUser) {
      return demoUser;
    }

    throw new Error("Demo user is missing. Apply D1 migrations before using user routes.");
  }

  const id = `tg-${telegramUser.id}`;
  await env.DB.prepare(
    `INSERT INTO users (
      id,
      telegram_id,
      username,
      display_name,
      role
    ) VALUES (?, ?, ?, ?, 'user')
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      display_name = excluded.display_name,
      updated_at = CURRENT_TIMESTAMP`
  )
    .bind(id, telegramUser.id, telegramUser.username ?? null, telegramUser.displayName)
    .run();

  const user = await env.DB.prepare("SELECT * FROM users WHERE telegram_id = ?").bind(telegramUser.id).first<UserRow>();

  if (!user) {
    throw new Error("Unable to create Telegram user");
  }

  return user;
}

async function getUserMediaStatus(env: Env, userId: string, mediaItemId: string): Promise<UserMediaStatus | null> {
  const row = await env.DB.prepare("SELECT * FROM user_media_status WHERE user_id = ? AND media_item_id = ?")
    .bind(userId, mediaItemId)
    .first<UserMediaStatusRow>();

  return row ? mapUserMediaStatusRow(row) : null;
}

async function upsertUserMediaStatus(
  env: Env,
  userId: string,
  mediaItemId: string,
  input: { status: WatchStatus; rating?: number; progress?: string; note?: string }
): Promise<UserMediaStatus> {
  const id = `${userId}-${mediaItemId}`;
  const existing = await getUserMediaStatus(env, userId, mediaItemId);
  const startedAt = existing?.startedAt ?? new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO user_media_status (
      id,
      user_id,
      media_item_id,
      status,
      rating,
      progress,
      note,
      started_at,
      completed_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, media_item_id) DO UPDATE SET
      status = excluded.status,
      rating = excluded.rating,
      progress = excluded.progress,
      note = excluded.note,
      completed_at = excluded.completed_at,
      updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      id,
      userId,
      mediaItemId,
      input.status,
      normalizeRating(input.rating),
      trimOptional(input.progress),
      trimOptional(input.note),
      startedAt,
      input.status === "completed" ? new Date().toISOString() : existing?.completedAt ?? null
    )
    .run();

  const status = await getUserMediaStatus(env, userId, mediaItemId);

  if (!status) {
    throw new Error("Unable to save media status");
  }

  return status;
}

function mapUserMediaStatusRow(row: UserMediaStatusRow): UserMediaStatus {
  return {
    id: row.id,
    userId: row.user_id,
    mediaItemId: row.media_item_id,
    status: row.status as WatchStatus,
    rating: row.rating ?? undefined,
    progress: row.progress ?? undefined,
    note: row.note ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at
  };
}

function parseTelegramUser(initData: string): { id: number; username?: string; displayName: string } | undefined {
  if (!initData) {
    return undefined;
  }

  const rawUser = new URLSearchParams(initData).get("user");

  if (!rawUser) {
    return undefined;
  }

  try {
    const user = JSON.parse(rawUser) as {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };

    if (!user.id) {
      return undefined;
    }

    const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || String(user.id);
    return { id: user.id, username: user.username, displayName };
  } catch {
    return undefined;
  }
}

function isWatchStatus(status: string): status is WatchStatus {
  return watchStatuses.includes(status as WatchStatus);
}

function isResourceType(type: string): type is ResourceType {
  return resourceTypes.includes(type as ResourceType);
}

function isResourceVisibility(visibility: string): visibility is ResourceVisibility {
  return resourceVisibilities.includes(visibility as ResourceVisibility);
}

function isReportTargetType(targetType: string | undefined): targetType is Report["targetType"] {
  return targetType === "resource" || targetType === "review" || targetType === "media_item";
}

function normalizeRating(rating: number | undefined): number | null {
  if (rating === undefined) {
    return null;
  }

  return Number.isInteger(rating) && rating >= 1 && rating <= 10 ? rating : null;
}

function trimOptional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
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
