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
  url?: string;
  versionNote?: string;
  fileSize?: string;
  resolution?: string;
  subtitleNote?: string;
  visibility: ResourceVisibility;
  requiredPoints: number;
  status: "pending" | "published" | "rejected" | "hidden" | "invalid" | "deleted";
  createdAt?: string;
}

export interface UserMediaStatus {
  id: string;
  userId: string;
  mediaItemId: string;
  status: WatchStatus;
  rating?: number;
  progress?: string;
  note?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface UserReview {
  id: string;
  userId: string;
  mediaItemId: string;
  displayName: string;
  rating?: number;
  body: string;
  containsSpoiler: boolean;
  likeCount: number;
  createdAt: string;
}

export interface Report {
  id: string;
  targetType: "resource" | "review" | "media_item";
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "rejected";
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  note?: string;
  createdAt: string;
}
