import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const THUMBNAILS_DIR = path.join(__dirname, '../../video-storage/thumbnails');

/**
 * Generate thumbnail from video using ffmpeg
 */
export async function generateThumbnail(videoPath, videoId, timestamp = '00:00:01') {
  try {
    await ensureDirectoryExists(THUMBNAILS_DIR);
    
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${videoId}.jpg`);
    
    // Use ffmpeg to extract frame at specified timestamp
    const command = `ffmpeg -i "${videoPath}" -ss ${timestamp} -vframes 1 -q:v 2 "${thumbnailPath}" -y`;
    
    try {
      await execAsync(command);
      
      // Check if thumbnail was created
      try {
        await fs.access(thumbnailPath);
        return `/thumbnails/${videoId}.jpg`;
      } catch {
        console.warn(`Thumbnail not created for ${videoId}, using fallback`);
        return null;
      }
    } catch (error) {
      console.error('FFmpeg error:', error.message);
      // If ffmpeg fails, return null (frontend can show placeholder)
      return null;
    }
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

/**
 * Get thumbnail path
 */
export function getThumbnailPath(videoId) {
  return path.join(THUMBNAILS_DIR, `${videoId}.jpg`);
}

/**
 * Save uploaded thumbnail image
 */
export async function saveUploadedThumbnail(thumbnailFile, videoId) {
  try {
    await ensureDirectoryExists(THUMBNAILS_DIR);
    
    // Get file extension from original name or use jpg as default
    const ext = path.extname(thumbnailFile.originalname || '').toLowerCase() || '.jpg';
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    
    // If extension is not in allowed list, fall back to .jpg
    const finalExt = allowedExts.includes(ext) ? ext : '.jpg';
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${videoId}${finalExt}`);
    
    console.log('Saving thumbnail:', {
      videoId,
      originalname: thumbnailFile.originalname,
      ext,
      finalExt,
      thumbnailPath,
      hasBuffer: !!thumbnailFile.buffer,
      bufferSize: thumbnailFile.buffer?.length
    });
    
    // If file is in memory (buffer), write it directly
    if (thumbnailFile.buffer) {
      await fs.writeFile(thumbnailPath, thumbnailFile.buffer);
      console.log('Thumbnail file written successfully to:', thumbnailPath);
      
      // Verify file was created
      try {
        const stats = await fs.stat(thumbnailPath);
        console.log('Thumbnail file verified, size:', stats.size, 'bytes');
      } catch (statError) {
        console.error('Failed to verify thumbnail file:', statError);
      }
    } else if (thumbnailFile.path) {
      // If file is on disk, copy it
      await fs.copyFile(thumbnailFile.path, thumbnailPath);
      console.log('Thumbnail file copied successfully to:', thumbnailPath);
    } else {
      throw new Error('Thumbnail file has no buffer or path');
    }
    
    // Return the URL path using the actual extension
    const thumbnailUrl = `/thumbnails/${videoId}${finalExt}`;
    console.log('Thumbnail URL to be saved:', thumbnailUrl);
    return thumbnailUrl;
  } catch (error) {
    console.error('Error saving uploaded thumbnail:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      videoId,
      hasBuffer: !!thumbnailFile.buffer,
      hasPath: !!thumbnailFile.path
    });
    throw error;
  }
}

