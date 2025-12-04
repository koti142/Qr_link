import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAPTIONS_DIR = path.join(__dirname, '../../video-storage/captions');

/**
 * Upload caption file
 */
export async function uploadCaption(videoId, language, fileBuffer, filename) {
  try {
    await ensureDirectoryExists(CAPTIONS_DIR);
    
    const captionPath = path.join(CAPTIONS_DIR, `${videoId}_${language}.vtt`);
    await fs.writeFile(captionPath, fileBuffer);
    
    const relativePath = `captions/${videoId}_${language}.vtt`;
    
    // Save to database
    const query = `
      INSERT INTO captions (video_id, language, file_path)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE file_path = ?
    `;
    
    await pool.execute(query, [videoId, language, relativePath, relativePath]);
    
    return relativePath;
  } catch (error) {
    console.error('Error uploading caption:', error);
    throw error;
  }
}

/**
 * Get captions for a video
 */
export async function getCaptionsByVideoId(videoId) {
  const query = 'SELECT * FROM captions WHERE video_id = ?';
  const [rows] = await pool.execute(query, [videoId]);
  return rows;
}

/**
 * Delete caption
 */
export async function deleteCaption(id) {
  const query = 'SELECT * FROM captions WHERE id = ?';
  const [rows] = await pool.execute(query, [id]);
  
  if (rows.length > 0) {
    const caption = rows[0];
    const filePath = path.join(__dirname, '../../video-storage', caption.file_path);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting caption file:', error);
    }
    
    const deleteQuery = 'DELETE FROM captions WHERE id = ?';
    const [result] = await pool.execute(deleteQuery, [id]);
    return result.affectedRows > 0;
  }
  
  return false;
}





