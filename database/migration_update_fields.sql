-- Migration: Update fields to separate Course, Grade, Lesson, Module, Activity
-- Run this to update the database structure

USE video_delivery;

-- Drop old columns if they exist
ALTER TABLE videos 
  DROP COLUMN IF EXISTS module_number,
  DROP COLUMN IF EXISTS module_name,
  DROP COLUMN IF EXISTS activity_name,
  DROP COLUMN IF EXISTS unit;

-- Add new columns
ALTER TABLE videos 
  ADD COLUMN course VARCHAR(255) NULL AFTER id,
  ADD COLUMN module VARCHAR(255) NULL AFTER lesson,
  ADD COLUMN activity VARCHAR(255) NULL AFTER module;

-- Modify existing columns to be VARCHAR for text input
ALTER TABLE videos 
  MODIFY COLUMN grade VARCHAR(255) NULL,
  MODIFY COLUMN lesson VARCHAR(255) NULL;

-- Add indexes
ALTER TABLE videos 
  ADD INDEX idx_course (course),
  ADD INDEX idx_module (module),
  ADD INDEX idx_activity (activity);





