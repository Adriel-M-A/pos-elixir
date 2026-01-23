-- Add source column to sales table
ALTER TABLE sales ADD COLUMN source TEXT DEFAULT 'LOCAL';
CREATE INDEX IF NOT EXISTS idx_sales_source ON sales(source);
