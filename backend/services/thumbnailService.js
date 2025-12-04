import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THUMBNAILS_DIR = path.join(__dirname, '../../video-storage/thumbnails');

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function saveUploadedThumbnail(thumbnailFile, videoId) {
  try {
    await ensureDirectoryExists(THUMBNAILS_DIR);
    
    const ext = path.extname(thumbnailFile.originalname).toLowerCase() || '.jpg';
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const finalExt = allowedExts.includes(ext) ? ext : '.jpg';
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${videoId}${finalExt}`);
    
    if (thumbnailFile.buffer) {
      await fs.writeFile(thumbnailPath, thumbnailFile.buffer);
    } else if (thumbnailFile.path) {
      await fs.copyFile(thumbnailFile.path, thumbnailPath);
    } else {
      throw new Error('Thumbnail file has no buffer or path');
    }
    
    return `/thumbnails/${videoId}${finalExt}`;
  } catch (error) {
    console.error('Error saving uploaded thumbnail:', error);
    throw error;
  }
}

export async function generateThumbnail(videoPath, videoId) {
  // Placeholder - in production, use ffmpeg to extract frame
  // For now, return null to indicate no thumbnail was generated
  console.log('Thumbnail generation from video not implemented yet');
  return null;
}

