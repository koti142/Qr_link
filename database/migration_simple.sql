-- Simple Migration: Add missing columns
-- Run this to fix the upload error

USE video_delivery;

-- Add course column
ALTER TABLE videos 
  ADD COLUMN course VARCHAR(255) NULL AFTER id;

-- Add module column  
ALTER TABLE videos 
  ADD COLUMN module VARCHAR(255) NULL AFTER lesson;

-- Add activity column
ALTER TABLE videos 
  ADD COLUMN activity VARCHAR(255) NULL AFTER module;

-- Add thumbnail_url column
ALTER TABLE videos 
  ADD COLUMN thumbnail_url VARCHAR(500) NULL AFTER qr_url;

-- Modify grade and lesson to VARCHAR (if they are INT)
ALTER TABLE videos 
  MODIFY COLUMN grade VARCHAR(255) NULL,
  MODIFY COLUMN lesson VARCHAR(255) NULL;

-- Add indexes
ALTER TABLE videos 
  ADD INDEX idx_course (course),
  ADD INDEX idx_module (module),
  ADD INDEX idx_activity (activity);

