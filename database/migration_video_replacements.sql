-- Migration: Create video_replacements table
-- This table tracks video replacements (block storage concept)
-- When a video is replaced, old videos with same redirect_slug are deleted
-- URL and QR code remain the same, only the video file changes

USE video_delivery;

CREATE TABLE IF NOT EXISTS video_replacements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  redirect_slug VARCHAR(100) NOT NULL,
  old_video_id VARCHAR(100) NOT NULL,
  new_video_id VARCHAR(100) NOT NULL,
  old_file_path VARCHAR(500),
  new_file_path VARCHAR(500),
  replaced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  replaced_by VARCHAR(100),
  notes TEXT,
  INDEX idx_redirect_slug (redirect_slug),
  INDEX idx_old_video_id (old_video_id),
  INDEX idx_new_video_id (new_video_id),
  INDEX idx_replaced_at (replaced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


