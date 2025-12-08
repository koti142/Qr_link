import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get full path to video storage directory
 */
export function getVideoStoragePath() {
  const configPath = path.join(__dirname, '../config/config.js');
  // For now, use relative path from backend to video-storage
  return path.join(__dirname, '../../video-storage');
}

/**
 * Get video file path
 */
export function getVideoFilePath(grade, unit, lesson, videoId, version = 1, quality = 'master') {
  const storagePath = getVideoStoragePath();
  const folderPath = path.join(
    storagePath,
    String(grade).padStart(2, '0'),
    `U${String(unit).padStart(2, '0')}`,
    `L${String(lesson).padStart(2, '0')}`
  );
  
  const versionStr = version > 1 ? `_v${String(version).padStart(2, '0')}` : '';
  const filename = `${videoId}${versionStr}_${quality}.mp4`;
  
  return path.join(folderPath, filename);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Resolve upload path correctly for both local and production
 * Handles relative paths (./upload) and absolute paths
 */
export function resolveUploadPath() {
  const backendDir = path.dirname(__dirname);
  
  if (path.isAbsolute(config.upload.uploadPath)) {
    // Absolute path - use as is
    return config.upload.uploadPath;
  } else if (config.upload.uploadPath.startsWith('./') || config.upload.uploadPath.startsWith('../')) {
    // Relative path - resolve from backend directory
    return path.resolve(backendDir, config.upload.uploadPath);
  } else {
    // Legacy: resolve from parent of backend (for ../video-storage)
    const basePath = path.dirname(backendDir);
    return path.resolve(basePath, config.upload.uploadPath);
  }
}





