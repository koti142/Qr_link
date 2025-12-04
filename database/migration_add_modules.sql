-- Migration: Add module and activity fields to videos table
-- Run this after the initial schema.sql

USE video_delivery;

ALTER TABLE videos 
  MODIFY COLUMN grade INT NULL,
  MODIFY COLUMN unit INT NULL,
  MODIFY COLUMN lesson INT NULL,
  MODIFY COLUMN topic VARCHAR(255) NULL,
  MODIFY COLUMN title VARCHAR(255) NULL,
  ADD COLUMN module_number INT NULL AFTER lesson,
  ADD COLUMN module_name VARCHAR(255) NULL AFTER module_number,
  ADD COLUMN activity_name VARCHAR(255) NULL AFTER module_name,
  ADD INDEX idx_module (module_number),
  ADD INDEX idx_activity (activity_name);

