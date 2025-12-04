import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get list of available thumbnails
 */
export async function getThumbnails(req, res) {
  try {
    // Resolve path from backend directory
    const backendDir = path.dirname(__dirname);
    const thumbnailsDir = path.join(backendDir, '../video-storage/thumbnails');
    const resolvedPath = path.resolve(thumbnailsDir);
    
    console.log('[Thumbnails] Looking for thumbnails in:', resolvedPath);
    
    // Check if directory exists
    try {
      await fs.access(resolvedPath);
      console.log('[Thumbnails] Directory exists');
    } catch (err) {
      console.error('[Thumbnails] Directory does not exist:', resolvedPath);
      return res.json({ thumbnails: [] });
    }
    
    // Read directory
    const files = await fs.readdir(resolvedPath);
    console.log('[Thumbnails] Found files:', files);
    
    // Filter for image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const thumbnails = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => ({
        filename: file,
        path: `/thumbnails/${file}`,
        name: path.basename(file, path.extname(file))
      }));
    
    console.log('[Thumbnails] Returning thumbnails:', thumbnails.length);
    res.json({ thumbnails });
  } catch (error) {
    console.error('[Thumbnails] Error getting thumbnails:', error);
    res.status(500).json({ error: 'Failed to get thumbnails', message: error.message });
  }
}

