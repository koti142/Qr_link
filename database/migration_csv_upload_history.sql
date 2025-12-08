-- Migration: Create csv_upload_history table
-- This table stores CSV upload history with file name, date/time, and status

USE video_delivery;

CREATE TABLE IF NOT EXISTS csv_upload_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT,
  total_videos INT DEFAULT 0,
  successful_videos INT DEFAULT 0,
  failed_videos INT DEFAULT 0,
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
  error_message TEXT,
  uploaded_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;






