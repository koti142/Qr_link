-- Migration: Add user roles and permissions to admins table
-- This migration enhances the admins table to support role-based access control

USE video_delivery;

-- Add new columns for role-based permissions (check if column exists first)
SET @dbname = DATABASE();
SET @tablename = 'admins';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'full_name') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN full_name VARCHAR(255) AFTER username'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'can_upload_videos') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN can_upload_videos BOOLEAN DEFAULT FALSE AFTER role'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'can_view_videos') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN can_view_videos BOOLEAN DEFAULT FALSE AFTER can_upload_videos'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'can_check_links') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN can_check_links BOOLEAN DEFAULT FALSE AFTER can_view_videos'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'can_check_qr_codes') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN can_check_qr_codes BOOLEAN DEFAULT FALSE AFTER can_check_links'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'is_active') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER can_check_qr_codes'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'created_by') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN created_by INT NULL AFTER is_active'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND COLUMN_NAME = 'last_login') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN last_login TIMESTAMP NULL AFTER created_by'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key for created_by (self-referencing) - only if it doesn't exist
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND CONSTRAINT_NAME = 'fk_created_by') > 0,
  'SELECT 1',
  'ALTER TABLE admins ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing admin users to have full permissions
UPDATE admins 
SET 
  role = 'admin',
  can_upload_videos = TRUE,
  can_view_videos = TRUE,
  can_check_links = TRUE,
  can_check_qr_codes = TRUE,
  is_active = TRUE
WHERE role = 'admin' OR role IS NULL;

-- Create index for faster lookups (only if they don't exist)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND INDEX_NAME = 'idx_admins_role') > 0,
  'SELECT 1',
  'CREATE INDEX idx_admins_role ON admins(role)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND INDEX_NAME = 'idx_admins_active') > 0,
  'SELECT 1',
  'CREATE INDEX idx_admins_active ON admins(is_active)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname 
   AND TABLE_NAME = @tablename 
   AND INDEX_NAME = 'idx_admins_email') > 0,
  'SELECT 1',
  'CREATE INDEX idx_admins_email ON admins(email)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add comments for documentation
ALTER TABLE admins 
MODIFY COLUMN role VARCHAR(50) DEFAULT 'viewer' COMMENT 'User role: admin, uploader, viewer',
MODIFY COLUMN can_upload_videos BOOLEAN DEFAULT FALSE COMMENT 'Permission to upload videos',
MODIFY COLUMN can_view_videos BOOLEAN DEFAULT FALSE COMMENT 'Permission to view videos',
MODIFY COLUMN can_check_links BOOLEAN DEFAULT FALSE COMMENT 'Permission to check/view redirect links',
MODIFY COLUMN can_check_qr_codes BOOLEAN DEFAULT FALSE COMMENT 'Permission to check/view QR codes',
MODIFY COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether the user account is active';

