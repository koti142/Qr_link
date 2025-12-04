-- Migration: Add missing columns to videos table
-- Run this to fix the "Unknown column 'course'" error

USE video_delivery;

-- Check and add course column
SET @dbname = DATABASE();
SET @tablename = "videos";
SET @columnname = "course";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column course already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(255) NULL AFTER id")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add module column
SET @columnname = "module";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column module already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(255) NULL AFTER lesson")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add activity column
SET @columnname = "activity";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column activity already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(255) NULL AFTER module")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add thumbnail_url column
SET @columnname = "thumbnail_url";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column thumbnail_url already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(500) NULL AFTER qr_url")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Modify grade and lesson to VARCHAR if they are INT
ALTER TABLE videos 
  MODIFY COLUMN grade VARCHAR(255) NULL,
  MODIFY COLUMN lesson VARCHAR(255) NULL;

-- Drop unit column if it exists (optional - comment out if you want to keep it)
-- ALTER TABLE videos DROP COLUMN IF EXISTS unit;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_course ON videos(course);
CREATE INDEX IF NOT EXISTS idx_module ON videos(module);
CREATE INDEX IF NOT EXISTS idx_activity ON videos(activity);





