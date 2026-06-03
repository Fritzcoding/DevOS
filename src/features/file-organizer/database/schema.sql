CREATE TABLE IF NOT EXISTS organizer_files (
  id TEXT PRIMARY KEY,
  root_dir TEXT NOT NULL,
  rel_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  extension TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  category TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  hash TEXT,
  embedding_id TEXT,
  summary TEXT,
  indexed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS organizer_operations (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  root_dir TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  from_path TEXT,
  to_path TEXT,
  reason TEXT NOT NULL,
  confidence REAL NOT NULL,
  risk TEXT NOT NULL,
  reversible INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  applied_at TEXT
);

CREATE TABLE IF NOT EXISTS organizer_rollback (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  from_path TEXT,
  to_path TEXT,
  rollback_from TEXT,
  rollback_to TEXT,
  status TEXT NOT NULL,
  error TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizer_files_root_path ON organizer_files(root_dir, rel_path);
CREATE INDEX IF NOT EXISTS idx_organizer_operations_batch ON organizer_operations(batch_id);
CREATE INDEX IF NOT EXISTS idx_organizer_rollback_batch ON organizer_rollback(batch_id);
