-- Migration: Create cloudflare_resources table
-- This table stores metadata for files uploaded to Cloudflare R2/Stream

USE video_delivery;

CREATE TABLE IF NOT EXISTS cloudflare_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  original_file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  cloudflare_url VARCHAR(1000) NOT NULL,
  cloudflare_key VARCHAR(500) NOT NULL,
  storage_type ENUM('r2', 'stream') DEFAULT 'r2',
  source_type ENUM('local', 'misc', 'upload') DEFAULT 'upload',
  source_path VARCHAR(1000),
  status ENUM('uploading', 'completed', 'failed') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cloudflare_key (cloudflare_key),
  INDEX idx_file_name (file_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;






