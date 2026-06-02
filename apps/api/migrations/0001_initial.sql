CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER NOT NULL UNIQUE,
  username TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  point_balance INTEGER NOT NULL DEFAULT 0,
  credit_score INTEGER NOT NULL DEFAULT 100,
  is_banned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  chinese_title TEXT NOT NULL,
  original_title TEXT,
  english_title TEXT,
  media_type TEXT NOT NULL,
  release_year INTEGER,
  regions TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '[]',
  poster_object_key TEXT,
  overview TEXT NOT NULL DEFAULT '',
  average_rating REAL,
  review_count INTEGER NOT NULL DEFAULT 0,
  resource_count INTEGER NOT NULL DEFAULT 0,
  telegraph_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_item_tags (
  media_item_id TEXT NOT NULL REFERENCES media_items(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (media_item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_credits (
  id TEXT PRIMARY KEY,
  media_item_id TEXT NOT NULL REFERENCES media_items(id),
  person_id TEXT NOT NULL REFERENCES people(id),
  role TEXT NOT NULL,
  character_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_media_status (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  media_item_id TEXT NOT NULL REFERENCES media_items(id),
  status TEXT NOT NULL,
  rating INTEGER,
  progress TEXT,
  note TEXT,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, media_item_id)
);

CREATE TABLE IF NOT EXISTS user_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  media_item_id TEXT NOT NULL REFERENCES media_items(id),
  rating INTEGER,
  body TEXT NOT NULL,
  contains_spoiler INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  media_item_id TEXT REFERENCES media_items(id),
  review_id TEXT REFERENCES user_reviews(id),
  parent_comment_id TEXT REFERENCES comments(id),
  body TEXT NOT NULL,
  contains_spoiler INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_posts (
  id TEXT PRIMARY KEY,
  media_item_id TEXT NOT NULL REFERENCES media_items(id),
  author_user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  url TEXT NOT NULL,
  version_note TEXT,
  file_size TEXT,
  resolution TEXT,
  subtitle_note TEXT,
  visibility TEXT NOT NULL DEFAULT 'review_only',
  price_type TEXT NOT NULL DEFAULT 'free',
  required_points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS point_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  related_resource_id TEXT REFERENCES resource_posts(id),
  created_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id TEXT PRIMARY KEY,
  moderator_user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegraph_pages (
  id TEXT PRIMARY KEY,
  media_item_id TEXT REFERENCES media_items(id),
  title TEXT NOT NULL,
  telegraph_url TEXT NOT NULL,
  page_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_items_type_year ON media_items(media_type, release_year);
CREATE INDEX IF NOT EXISTS idx_user_reviews_media_item ON user_reviews(media_item_id);
CREATE INDEX IF NOT EXISTS idx_resource_posts_media_status ON resource_posts(media_item_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
