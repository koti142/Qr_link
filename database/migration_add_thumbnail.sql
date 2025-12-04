-- Migration: Add thumbnail_url column to videos table
USE video_delivery;

ALTER TABLE videos 
  ADD COLUMN thumbnail_url VARCHAR(500) NULL AFTER qr_url;





