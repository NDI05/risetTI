PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mahasiswa', 'admin')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS catalog_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  year INTEGER NOT NULL,
  institution TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  external_id TEXT,
  doi TEXT,
  license TEXT,
  language TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS catalog_external_id
  ON catalog_references(external_id) WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS reference_tags (
  reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('domain', 'method', 'technology')),
  tag TEXT NOT NULL,
  PRIMARY KEY (reference_id, tag_type, tag)
);
CREATE INDEX IF NOT EXISTS reference_tags_lookup ON reference_tags(tag_type, tag COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS shortlist (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, reference_id)
);
CREATE INDEX IF NOT EXISTS shortlist_user_created ON shortlist(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem TEXT NOT NULL DEFAULT '',
  context TEXT NOT NULL DEFAULT '',
  data_sources TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT '',
  technologies TEXT NOT NULL DEFAULT '',
  technical_needs TEXT NOT NULL DEFAULT '',
  time_resources TEXT NOT NULL DEFAULT '',
  risks_validation TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ideas_user_updated ON ideas(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS idea_references (
  idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, reference_id)
);

CREATE TABLE IF NOT EXISTS idea_section_references (
  idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, section_key, reference_id)
);

CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_attempts (
  address_hash TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_attempts_window ON auth_attempts(attempted_at);
