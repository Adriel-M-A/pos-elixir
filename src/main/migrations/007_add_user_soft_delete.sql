-- Add created_by_name column to Sales to preserve history after user deletion
ALTER TABLE sales ADD COLUMN created_by_name TEXT;

-- Backfill existing sales with current user names
UPDATE sales 
SET created_by_name = (
    SELECT name 
    FROM users 
    WHERE users.id = sales.created_by
);

-- Default unknown for any that couldn't be matched (orphans)
UPDATE sales SET created_by_name = 'Usuario Eliminado' WHERE created_by_name IS NULL AND created_by IS NOT NULL;
