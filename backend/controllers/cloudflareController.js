import pool from '../config/database.js';
import config from '../config/config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all Cloudflare resources
 */
export async function getCloudflareResources(req, res) {
  try {
    const [resources] = await pool.execute(
      'SELECT * FROM cloudflare_resources ORDER BY created_at DESC'
    );
    res.json({ resources });
  } catch (error) {
    console.error('Error getting Cloudflare resources:', error);
    res.status(500).json({ error: 'Failed to get Cloudflare resources', message: error.message });
  }
}

/**
 * Get misc folder files (for left side)
 */
export async function getMiscFiles(req, res) {
  try {
    const backendDir = path.dirname(__dirname);
    const miscPath = path.resolve(backendDir, '../video-storage/misc');
    
    // Check if directory exists
    try {
      await fs.access(miscPath);
    } catch {
      return res.json({ files: [] });
    }
    
    // Read directory
    const files = await fs.readdir(miscPath);
    
    // Get file stats
    const fileList = await Promise.all(
      files.map(async (filename) => {
        try {
          const filePath = path.join(miscPath, filename);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            return {
              filename,
              size: stats.size,
              sizeFormatted: formatFileSize(stats.size),
              path: filePath,
              relativePath: `misc/${filename}`,
              modified: stats.mtime
            };
          }
          return null;
        } catch (err) {
          console.error(`Error reading file ${filename}:`, err);
          return null;
        }
      })
    );
    
    const validFiles = fileList.filter(file => file !== null);
    res.json({ files: validFiles });
  } catch (error) {
    console.error('Error getting misc files:', error);
    res.status(500).json({ error: 'Failed to get misc files', message: error.message });
  }
}

/**
 * Upload file to Cloudflare (mock/test mode)
 */
export async function uploadToCloudflare(req, res) {
  try {
    const { fileName, fileSize, fileType, sourceType, sourcePath, testMode } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }
    
    // Generate mock Cloudflare data
    const cloudflareKey = `cloudflare/${Date.now()}_${fileName}`;
    const cloudflareUrl = testMode 
      ? `https://mock-cloudflare.example.com/${cloudflareKey}`
      : `https://your-account.r2.cloudflarestorage.com/${cloudflareKey}`;
    
    // In real implementation, upload file to Cloudflare here
    // For now, we'll just store the metadata
    
    // Insert into database
    const [result] = await pool.execute(
      `INSERT INTO cloudflare_resources 
       (file_name, original_file_name, file_size, file_type, cloudflare_url, cloudflare_key, storage_type, source_type, source_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileName,
        fileName,
        fileSize || 0,
        fileType || 'application/octet-stream',
        cloudflareUrl,
        cloudflareKey,
        'r2',
        sourceType || 'upload',
        sourcePath || null,
        'completed'
      ]
    );
    
    res.json({
      success: true,
      resource: {
        id: result.insertId,
        file_name: fileName,
        cloudflare_url: cloudflareUrl,
        cloudflare_key: cloudflareKey,
        test_mode: testMode || false
      }
    });
  } catch (error) {
    console.error('Error uploading to Cloudflare:', error);
    res.status(500).json({ error: 'Failed to upload to Cloudflare', message: error.message });
  }
}

/**
 * Get videos using mock Cloudflare URLs
 */
export async function getVideosWithMockUrls(req, res) {
  try {
    const [videos] = await pool.execute(
      `SELECT id, video_id, title, streaming_url, file_path, created_at
       FROM videos
       WHERE status = 'active'
       AND (
         streaming_url LIKE '%your-account.r2.cloudflarestorage.com%' OR
         streaming_url LIKE '%mock-cloudflare.example.com%' OR
         streaming_url LIKE '%example.com%' OR
         (streaming_url LIKE '%test.cloudflare%')
       )
       ORDER BY created_at DESC`
    );
    
    res.json({ videos });
  } catch (error) {
    console.error('Error getting videos with mock URLs:', error);
    res.status(500).json({ error: 'Failed to get videos', message: error.message });
  }
}

/**
 * Update Cloudflare resource URL and optionally update videos using it
 */
export async function updateCloudflareResource(req, res) {
  try {
    const { id } = req.params;
    const { cloudflare_url, cloudflare_key, updateVideos = false } = req.body;
    
    if (!cloudflare_url) {
      return res.status(400).json({ error: 'Cloudflare URL is required' });
    }
    
    // Get old URL before updating
    const [oldResources] = await pool.execute(
      'SELECT cloudflare_url FROM cloudflare_resources WHERE id = ?',
      [id]
    );
    
    if (oldResources.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const oldUrl = oldResources[0].cloudflare_url;
    
    // Update in database
    const updateFields = [];
    const updateValues = [];
    
    if (cloudflare_url) {
      updateFields.push('cloudflare_url = ?');
      updateValues.push(cloudflare_url);
    }
    
    if (cloudflare_key) {
      updateFields.push('cloudflare_key = ?');
      updateValues.push(cloudflare_key);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const [result] = await pool.execute(
      `UPDATE cloudflare_resources 
       SET ${updateFields.join(', ')} 
       WHERE id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // If updateVideos is true, update all videos using the old URL
    let videosUpdated = 0;
    if (updateVideos && oldUrl) {
      try {
        const [updateResult] = await pool.execute(
          `UPDATE videos 
           SET streaming_url = ?, file_path = ?, updated_at = CURRENT_TIMESTAMP
           WHERE (streaming_url = ? OR file_path = ?) 
           AND status = 'active'`,
          [cloudflare_url, cloudflare_url, oldUrl, oldUrl]
        );
        videosUpdated = updateResult.affectedRows;
        console.log(`Updated ${videosUpdated} video(s) with new Cloudflare URL`);
      } catch (updateError) {
        console.error('Error updating videos:', updateError);
        // Don't fail the resource update if video update fails
      }
    }
    
    // Get updated resource
    const [resources] = await pool.execute(
      'SELECT * FROM cloudflare_resources WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true, 
      message: `Resource updated successfully${videosUpdated > 0 ? ` and ${videosUpdated} video(s) updated` : ''}`,
      resource: resources[0],
      videosUpdated
    });
  } catch (error) {
    console.error('Error updating Cloudflare resource:', error);
    res.status(500).json({ error: 'Failed to update resource', message: error.message });
  }
}

/**
 * Get videos using a specific Cloudflare resource URL
 */
export async function getVideosByCloudflareUrl(req, res) {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    const [videos] = await pool.execute(
      `SELECT id, video_id, title, streaming_url, file_path, created_at
       FROM videos
       WHERE status = 'active'
       AND (streaming_url = ? OR file_path = ?)
       ORDER BY created_at DESC`,
      [url, url]
    );
    
    res.json({ videos });
  } catch (error) {
    console.error('Error getting videos by Cloudflare URL:', error);
    res.status(500).json({ error: 'Failed to get videos', message: error.message });
  }
}

/**
 * Delete Cloudflare resource
 */
export async function deleteCloudflareResource(req, res) {
  try {
    const { id } = req.params;
    
    // Delete from database
    const [result] = await pool.execute(
      'DELETE FROM cloudflare_resources WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // In real implementation, delete from Cloudflare here
    
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting Cloudflare resource:', error);
    res.status(500).json({ error: 'Failed to delete resource', message: error.message });
  }
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

