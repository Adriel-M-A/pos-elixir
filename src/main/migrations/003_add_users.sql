-- Add Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'CASHIER', 'WAITER')),
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add created_by to Sales
-- Note: SQLite does not support adding column with FK in one statement nicely for existing tables,
-- but we can add the column first. Not strictly enforcing FK on existing data to simplify migration.
ALTER TABLE sales ADD COLUMN created_by INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);

-- Insert Default Admin User
-- Password: '1234' -> $2b$10$LbgwAfDJGVUjDkGiDuA22ue4Ko5Q8SEYA1AhCLHL90knaxUxtpkFK
INSERT OR IGNORE INTO users (id, username, password_hash, role, name, is_active, created_at, updated_at)
VALUES (1, 'admin', '$2b$10$LbgwAfDJGVUjDkGiDuA22ue4Ko5Q8SEYA1AhCLHL90knaxUxtpkFK', 'ADMIN', 'Administrador', 1, datetime('now'), datetime('now'));
