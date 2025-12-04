-- Quick check to see if thumbnail_url column exists
USE video_delivery;

-- Check if thumbnail_url column exists
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

-- If no results, the column doesn't exist - run the migration
-- If results show, the column exists and is ready to use

