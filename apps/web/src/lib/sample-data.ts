import type { MediaItem, ResourcePost } from "@screenharbor/shared";

export const featuredMedia: MediaItem[] = [
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
  },
  {
    id: "frieren",
    chineseTitle: "葬送的芙莉莲",
    originalTitle: "葬送のフリーレン",
    englishTitle: "Frieren: Beyond Journey's End",
    type: "anime",
    year: 2023,
    regions: ["日本"],
    languages: ["日语"],
    posterUrl: "https://image.tmdb.org/t/p/w500/dGgFzj8N7xB2w1snNVvGCmC2m0s.jpg",
    overview: "勇者队伍旅途结束之后，长寿的精灵重新理解时间、离别和人与人之间微小而珍贵的记忆。",
    tags: ["动画", "奇幻", "治愈"],
    averageRating: 9.1,
    reviewCount: 2412,
    resourceCount: 35,
    telegraphUrl: "https://telegra.ph/"
  },
  {
    id: "severance",
    chineseTitle: "人生切割术",
    originalTitle: "Severance",
    englishTitle: "Severance",
    type: "series",
    year: 2022,
    regions: ["美国"],
    languages: ["英语"],
    posterUrl: "https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg",
    overview: "一群员工接受记忆分离手术，工作人格和生活人格被彻底切开，办公室逐渐显露诡异真相。",
    tags: ["悬疑", "科幻", "职场"],
    averageRating: 8.7,
    reviewCount: 908,
    resourceCount: 12,
    telegraphUrl: "https://telegra.ph/"
  }
];

export const latestResources: ResourcePost[] = [
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
