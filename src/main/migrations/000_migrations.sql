-- Tabla para llevar el control de las migraciones ejecutadas
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  executed_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
