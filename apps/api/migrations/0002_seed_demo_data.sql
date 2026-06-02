INSERT OR IGNORE INTO media_items (
  id,
  chinese_title,
  original_title,
  english_title,
  media_type,
  release_year,
  regions,
  languages,
  poster_object_key,
  overview,
  average_rating,
  review_count,
  resource_count,
  telegraph_url
) VALUES
  (
    'the-wandering-earth-2',
    '流浪地球 2',
    '流浪地球 2',
    'The Wandering Earth II',
    'movie',
    2023,
    '["中国大陆"]',
    '["普通话","英语"]',
    'https://image.tmdb.org/t/p/w500/pR858ihc6Ls9xohpdRJVjV787ml.jpg',
    '太阳危机将至，人类启动行星发动机计划，在宏大的灾难叙事里追问技术、牺牲和文明延续。',
    8.3,
    1524,
    18,
    'https://telegra.ph/'
  ),
  (
    'frieren',
    '葬送的芙莉莲',
    '葬送のフリーレン',
    'Frieren: Beyond Journey''s End',
    'anime',
    2023,
    '["日本"]',
    '["日语"]',
    'https://image.tmdb.org/t/p/w500/dGgFzj8N7xB2w1snNVvGCmC2m0s.jpg',
    '勇者队伍旅途结束之后，长寿的精灵重新理解时间、离别和人与人之间微小而珍贵的记忆。',
    9.1,
    2412,
    35,
    'https://telegra.ph/'
  ),
  (
    'severance',
    '人生切割术',
    'Severance',
    'Severance',
    'series',
    2022,
    '["美国"]',
    '["英语"]',
    'https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
    '一群员工接受记忆分离手术，工作人格和生活人格被彻底切开，办公室逐渐显露诡异真相。',
    8.7,
    908,
    12,
    'https://telegra.ph/'
  );

INSERT OR IGNORE INTO tags (id, name) VALUES
  ('tag-sci-fi', '科幻'),
  ('tag-disaster', '灾难'),
  ('tag-space', '太空'),
  ('tag-animation', '动画'),
  ('tag-fantasy', '奇幻'),
  ('tag-healing', '治愈'),
  ('tag-mystery', '悬疑'),
  ('tag-workplace', '职场');

INSERT OR IGNORE INTO media_item_tags (media_item_id, tag_id) VALUES
  ('the-wandering-earth-2', 'tag-sci-fi'),
  ('the-wandering-earth-2', 'tag-disaster'),
  ('the-wandering-earth-2', 'tag-space'),
  ('frieren', 'tag-animation'),
  ('frieren', 'tag-fantasy'),
  ('frieren', 'tag-healing'),
  ('severance', 'tag-mystery'),
  ('severance', 'tag-sci-fi'),
  ('severance', 'tag-workplace');

INSERT OR IGNORE INTO users (
  id,
  telegram_id,
  username,
  display_name,
  role
) VALUES (
  'demo-contributor',
  100000001,
  'demo_contributor',
  'Demo Contributor',
  'contributor'
);

INSERT OR IGNORE INTO resource_posts (
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
) VALUES
  (
    'res-001',
    'frieren',
    'demo-contributor',
    'WEB-DL 1080p 简繁字幕合集',
    'subtitle',
    'https://example.com/frieren-subtitles',
    '全季字幕合集',
    '128MB',
    '1080p',
    '简繁双语',
    'login_only',
    'free',
    0,
    'published'
  ),
  (
    'res-002',
    'the-wandering-earth-2',
    'demo-contributor',
    '蓝光原盘版本说明',
    'cloud_drive',
    'https://example.com/twe2-bluray',
    '蓝光原盘版本说明和校验信息',
    '46GB',
    '2160p',
    '内封中字',
    'points_only',
    'points',
    20,
    'pending'
  );
