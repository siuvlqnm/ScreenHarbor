export const mediaTypes = ["movie", "series", "anime", "documentary", "variety"] as const;
export const watchStatuses = ["planned", "watching", "completed", "dropped", "rewatching"] as const;
export const resourceTypes = ["torrent", "ed2k", "cloud_drive", "subtitle", "other"] as const;
export const resourceVisibilities = ["public", "login_only", "author_only", "review_only", "points_only"] as const;

export type MediaType = (typeof mediaTypes)[number];
export type WatchStatus = (typeof watchStatuses)[number];
export type ResourceType = (typeof resourceTypes)[number];
export type ResourceVisibility = (typeof resourceVisibilities)[number];

export interface MediaItem {
  id: string;
  chineseTitle: string;
  originalTitle?: string;
  englishTitle?: string;
  type: MediaType;
  year: number;
  regions: string[];
  languages: string[];
  posterUrl?: string;
  overview: string;
  tags: string[];
  averageRating?: number;
  reviewCount: number;
  resourceCount: number;
  telegraphUrl?: string;
}

export interface ResourcePost {
  id: string;
  mediaItemId: string;
  title: string;
  type: ResourceType;
  visibility: ResourceVisibility;
  requiredPoints: number;
  status: "pending" | "published" | "rejected" | "hidden" | "invalid" | "deleted";
}
