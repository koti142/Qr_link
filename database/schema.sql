-- Video Delivery System Database Schema

CREATE DATABASE IF NOT EXISTS video_delivery;
USE video_delivery;

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  grade INT NOT NULL,
  unit INT NOT NULL,
  lesson INT NOT NULL,
  topic VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(10) DEFAULT 'en',
  file_path VARCHAR(500) NOT NULL,
  streaming_url VARCHAR(500) NOT NULL,
  qr_url VARCHAR(500),
  redirect_slug VARCHAR(100) NOT NULL UNIQUE,
  duration INT DEFAULT 0 COMMENT 'Duration in seconds',
  size BIGINT DEFAULT 0 COMMENT 'File size in bytes',
  version INT DEFAULT 1,
  status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_video_id (video_id),
  INDEX idx_grade_unit_lesson (grade, unit, lesson),
  INDEX idx_status (status),
  INDEX idx_redirect_slug (redirect_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Redirects table
CREATE TABLE IF NOT EXISTS redirects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  target_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Captions table
CREATE TABLE IF NOT EXISTS captions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_video_language (video_id, language),
  INDEX idx_video_id (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Video versions table
CREATE TABLE IF NOT EXISTS video_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(100) NOT NULL,
  version INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  size BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_video_version (video_id, version),
  INDEX idx_video_id (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics table (for future use)
CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  user_id VARCHAR(100),
  session_id VARCHAR(100),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_video_id (video_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





