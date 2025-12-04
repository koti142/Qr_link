-- Migration: Add thumbnail_url field to videos table
-- This migration adds the thumbnail_url column to store thumbnail image paths

USE video_delivery;

-- Add thumbnail_url column if it doesn't exist
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500) NULL AFTER qr_url;

-- Add index for faster thumbnail lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_thumbnail_url ON videos(thumbnail_url(255));

-- Add comment for documentation
ALTER TABLE videos 
MODIFY COLUMN thumbnail_url VARCHAR(500) NULL COMMENT 'URL path to the video thumbnail image (e.g., /thumbnails/videoId.jpg)';

-- Verify the column was added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'video_delivery' 
  AND TABLE_NAME = 'videos' 
  AND COLUMN_NAME = 'thumbnail_url';

