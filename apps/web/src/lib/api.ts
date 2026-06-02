import type {
  MediaItem,
  Report,
  ResourcePost,
  ResourceType,
  ResourceVisibility,
  UserMediaStatus,
  UserReview,
  WatchStatus
} from "@screenharbor/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function fetchMediaItems(): Promise<MediaItem[]> {
  return fetchJson<{ items: MediaItem[] }>("/media").then((response) => response.items);
}

export async function fetchLatestResources(): Promise<ResourcePost[]> {
  return fetchJson<{ items: ResourcePost[] }>("/resources/latest").then((response) => response.items);
}

export async function fetchMediaResources(mediaItemId: string): Promise<ResourcePost[]> {
  return fetchJson<{ items: ResourcePost[] }>(`/media/${mediaItemId}/resources`).then((response) => response.items);
}

export async function fetchMediaReviews(mediaItemId: string): Promise<UserReview[]> {
  return fetchJson<{ items: UserReview[] }>(`/media/${mediaItemId}/reviews`).then((response) => response.items);
}

export async function fetchPendingResources(telegramInitData: string): Promise<ResourcePost[]> {
  return fetchJson<{ items: ResourcePost[] }>("/admin/resources/pending", { telegramInitData }).then(
    (response) => response.items
  );
}

export async function fetchUserMediaStatus(mediaItemId: string, telegramInitData: string): Promise<UserMediaStatus | null> {
  return fetchJson<{ status: UserMediaStatus | null }>(`/media/${mediaItemId}/status`, {
    telegramInitData
  }).then((response) => response.status);
}

export async function saveUserMediaStatus(
  mediaItemId: string,
  status: WatchStatus,
  telegramInitData: string
): Promise<UserMediaStatus> {
  return fetchJson<{ status: UserMediaStatus }>(`/media/${mediaItemId}/status`, {
    body: { status },
    method: "POST",
    telegramInitData
  }).then((response) => response.status);
}

export async function createReview(
  mediaItemId: string,
  input: { body: string; rating?: number; containsSpoiler: boolean },
  telegramInitData: string
): Promise<UserReview> {
  return fetchJson<{ review: UserReview }>(`/media/${mediaItemId}/reviews`, {
    body: input,
    method: "POST",
    telegramInitData
  }).then((response) => response.review);
}

export async function createResource(
  mediaItemId: string,
  input: {
    title: string;
    type: ResourceType;
    url: string;
    versionNote?: string;
    fileSize?: string;
    resolution?: string;
    subtitleNote?: string;
    visibility: ResourceVisibility;
    requiredPoints: number;
  },
  telegramInitData: string
): Promise<ResourcePost> {
  return fetchJson<{ resource: ResourcePost }>(`/media/${mediaItemId}/resources`, {
    body: input,
    method: "POST",
    telegramInitData
  }).then((response) => response.resource);
}

export async function createReport(
  input: { targetType: Report["targetType"]; targetId: string; reason: string },
  telegramInitData: string
): Promise<Report> {
  return fetchJson<{ report: Report }>("/reports", {
    body: input,
    method: "POST",
    telegramInitData
  }).then((response) => response.report);
}

export async function moderateResource(
  resourceId: string,
  action: "publish" | "reject" | "hide",
  telegramInitData: string
): Promise<ResourcePost | null> {
  return fetchJson<{ resource: ResourcePost | null }>(`/admin/resources/${resourceId}/moderate`, {
    body: { action },
    method: "POST",
    telegramInitData
  }).then((response) => response.resource);
}

async function fetchJson<T>(
  path: string,
  options: { body?: unknown; method?: "GET" | "POST"; telegramInitData?: string } = {}
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.telegramInitData ? { "X-Telegram-Init-Data": options.telegramInitData } : {})
    },
    method: options.method ?? "GET"
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
