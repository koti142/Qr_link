-- Migration: Add partner_id column to videos table
-- Run this to add PartnerID support

USE video_delivery;

-- Add partner_id column if it doesn't exist
ALTER TABLE videos 
  ADD COLUMN IF NOT EXISTS partner_id VARCHAR(100) NULL AFTER video_id;

-- Add index for partner_id
ALTER TABLE videos 
  ADD INDEX IF NOT EXISTS idx_partner_id (partner_id);

-- Add unique constraint on partner_id (optional - uncomment if you want unique PartnerIDs)
-- ALTER TABLE videos 
--   ADD UNIQUE INDEX IF NOT EXISTS unique_partner_id (partner_id);






