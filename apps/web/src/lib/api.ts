import type { MediaItem, ResourcePost } from "@screenharbor/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function fetchMediaItems(): Promise<MediaItem[]> {
  return fetchJson<{ items: MediaItem[] }>("/media").then((response) => response.items);
}

export async function fetchLatestResources(): Promise<ResourcePost[]> {
  return fetchJson<{ items: ResourcePost[] }>("/resources/latest").then((response) => response.items);
}

async function fetchJson<T>(path: string): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
