-- Migration: Add user roles and permissions to admins table
-- This migration enhances the admins table to support role-based access control
-- Run this migration to add user management features

USE video_delivery;

-- Add full_name column (if it doesn't exist)
-- Note: If column already exists, you'll get an error - that's okay, just continue
ALTER TABLE admins 
ADD COLUMN full_name VARCHAR(255) AFTER username;

-- Add permission columns
ALTER TABLE admins 
ADD COLUMN can_upload_videos BOOLEAN DEFAULT FALSE AFTER role,
ADD COLUMN can_view_videos BOOLEAN DEFAULT FALSE AFTER can_upload_videos,
ADD COLUMN can_check_links BOOLEAN DEFAULT FALSE AFTER can_view_videos,
ADD COLUMN can_check_qr_codes BOOLEAN DEFAULT FALSE AFTER can_check_links;

-- Add status and tracking columns
ALTER TABLE admins 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER can_check_qr_codes,
ADD COLUMN created_by INT NULL AFTER is_active,
ADD COLUMN last_login TIMESTAMP NULL AFTER created_by;

-- Add foreign key for created_by (self-referencing)
-- Note: If constraint already exists, you'll get an error - that's okay
ALTER TABLE admins
ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL;

-- Update existing admin users to have full permissions
UPDATE admins 
SET 
  role = COALESCE(role, 'admin'),
  can_upload_videos = COALESCE(can_upload_videos, TRUE),
  can_view_videos = COALESCE(can_view_videos, TRUE),
  can_check_links = COALESCE(can_check_links, TRUE),
  can_check_qr_codes = COALESCE(can_check_qr_codes, TRUE),
  is_active = COALESCE(is_active, TRUE)
WHERE role = 'admin' OR role IS NULL;

-- Create indexes for faster lookups (ignore errors if they exist)
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_active ON admins(is_active);
CREATE INDEX idx_admins_email ON admins(email);

-- Add comments for documentation
ALTER TABLE admins 
MODIFY COLUMN role VARCHAR(50) DEFAULT 'viewer' COMMENT 'User role: admin, uploader, viewer',
MODIFY COLUMN can_upload_videos BOOLEAN DEFAULT FALSE COMMENT 'Permission to upload videos',
MODIFY COLUMN can_view_videos BOOLEAN DEFAULT FALSE COMMENT 'Permission to view videos',
MODIFY COLUMN can_check_links BOOLEAN DEFAULT FALSE COMMENT 'Permission to check/view redirect links',
MODIFY COLUMN can_check_qr_codes BOOLEAN DEFAULT FALSE COMMENT 'Permission to check/view QR codes',
MODIFY COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether the user account is active';

