-- Complete Migration: Update videos table with all new fields
-- Run this to update your database with course, module, activity, and thumbnail_url columns

USE video_delivery;

-- Add new columns if they don't exist
ALTER TABLE videos 
  MODIFY COLUMN grade VARCHAR(255) NULL,
  MODIFY COLUMN lesson VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS course VARCHAR(255) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS module VARCHAR(255) NULL AFTER lesson,
  ADD COLUMN IF NOT EXISTS activity VARCHAR(255) NULL AFTER module,
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500) NULL AFTER qr_url;

-- Drop old unit column if it exists (we're using course instead)
ALTER TABLE videos 
  DROP COLUMN IF EXISTS unit;

-- Add indexes for new columns
ALTER TABLE videos 
  ADD INDEX IF NOT EXISTS idx_course (course),
  ADD INDEX IF NOT EXISTS idx_module (module),
  ADD INDEX IF NOT EXISTS idx_activity (activity);





