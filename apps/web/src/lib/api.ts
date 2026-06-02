import type { MediaItem, ResourcePost, UserMediaStatus, WatchStatus } from "@screenharbor/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function fetchMediaItems(): Promise<MediaItem[]> {
  return fetchJson<{ items: MediaItem[] }>("/media").then((response) => response.items);
}

export async function fetchLatestResources(): Promise<ResourcePost[]> {
  return fetchJson<{ items: ResourcePost[] }>("/resources/latest").then((response) => response.items);
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
