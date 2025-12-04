import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import * as videoService from '../services/videoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get MIME type based on file extension
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/x-m4v',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv',
  };
  return mimeTypes[ext] || 'video/mp4'; // Default to mp4 if unknown
}

/**
 * Stream video with HTTP range request support
 * This allows seeking, partial downloads, and efficient streaming
 */
export async function streamVideo(req, res) {
  try {
    const { videoId } = req.params;
    console.log('===== STREAM CONTROLLER CALLED =====');
    console.log('Stream request received for videoId:', videoId);
    console.log('Request details:', {
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query
    });
    
    // Get video from database - try active first, then include inactive
    let video = await videoService.getVideoByVideoId(videoId, false);
    if (!video) {
      console.log('Video not found with active status, trying to include inactive videos...');
      video = await videoService.getVideoByVideoId(videoId, true);
      if (video) {
        console.log('Video found but status is:', video.status);
      }
    }
    
    if (!video) {
      console.error('Video not found in database for videoId:', videoId);
      return res.status(404).json({ 
        error: 'Video not found',
        videoId: videoId,
        suggestion: 'Check if video exists and has status "active"'
      });
    }
    
    console.log('Video found:', {
      videoId: video.video_id,
      filePath: video.file_path,
      uploadPath: config.upload.uploadPath
    });
    
    // Build full file path - handle both relative and absolute paths
    let filePath;
    if (path.isAbsolute(video.file_path)) {
      filePath = video.file_path;
    } else {
      // If uploadPath is relative, resolve from backend directory
      const basePath = path.dirname(__dirname);
      const uploadPath = path.isAbsolute(config.upload.uploadPath) 
        ? config.upload.uploadPath 
        : path.resolve(basePath, config.upload.uploadPath);
      filePath = path.join(uploadPath, video.file_path);
    }
    
    // Normalize path separators (important for Windows)
    filePath = path.normalize(filePath);
    
    // Try multiple path resolution strategies if file doesn't exist
    const possiblePaths = [filePath];
    const basePath = path.dirname(__dirname);
    
    // Strategy 1: Direct path from database (already tried above)
    
    // Strategy 2: Try misc folder (THE ACTUAL LOCATION)
    // Files are stored in video-storage/misc (from project root)
    // Upload path is ../video-storage from backend, so misc is at uploadPath/misc
    const uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    const miscPath = path.join(uploadPath, 'misc');
    
    console.log('Path resolution:', {
      basePath,
      configUploadPath: config.upload.uploadPath,
      resolvedUploadPath: uploadPath,
      resolvedMiscPath: miscPath,
      miscPathExists: fs.existsSync(miscPath)
    });
    
    // If file_path is just a filename, try misc folder
    const fileName = path.basename(video.file_path);
    possiblePaths.push(path.join(miscPath, fileName));
    
    // If file_path includes misc, try direct join
    if (video.file_path.includes('misc') || video.file_path.includes('MISC')) {
      possiblePaths.push(path.join(uploadPath, video.file_path));
      // Also try with just the filename in misc
      possiblePaths.push(path.join(miscPath, fileName));
    }
    
    // Strategy 3: Try with upload path structure
    possiblePaths.push(path.join(uploadPath, video.file_path));
    
    // Strategy 4: If file_path doesn't include folder, try adding misc (most common case)
    if (!video.file_path.includes('/') && !video.file_path.includes('\\')) {
      possiblePaths.push(path.join(miscPath, video.file_path));
    }
    
    // Strategy 5: Try original upload path structure (relative to backend)
    possiblePaths.push(path.resolve(basePath, '..', 'video-storage', video.file_path));
    
    // Strategy 6: Try absolute path if it looks like a Windows path
    if (video.file_path.includes('\\') || video.file_path.includes('/')) {
      possiblePaths.push(path.resolve(video.file_path));
    }
    
    // Remove duplicates and log
    const uniquePaths = [...new Set(possiblePaths)];
    console.log('All possible paths to try:', uniquePaths);
    
    // Find the first path that exists
    filePath = uniquePaths.find(p => {
      try {
        const exists = fs.existsSync(p);
        if (exists) {
          console.log('✓ Found file at:', p);
        }
        return exists;
      } catch {
        return false;
      }
    });
    
    // If still not found, search misc folder by filename
    if (!filePath) {
      if (fs.existsSync(miscPath)) {
        try {
          const fileName = path.basename(video.file_path); // e.g., VID_1764675366468_master.mp4
          const miscFiles = fs.readdirSync(miscPath).filter(f => 
            f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm')
          );
          console.log('Searching misc folder for:', fileName);
          console.log('Files in misc folder:', miscFiles);
          
          // Try exact match first
          const exactMatch = miscFiles.find(f => f === fileName);
          if (exactMatch) {
            filePath = path.join(miscPath, exactMatch);
            console.log('✓ Found exact match in misc folder:', filePath);
          } else {
            // Try partial match (match by video ID prefix)
            const videoIdPrefix = fileName.split('_')[0]; // e.g., "VID_1764675366468"
            const partialMatch = miscFiles.find(f => f.startsWith(videoIdPrefix));
            if (partialMatch) {
              filePath = path.join(miscPath, partialMatch);
              console.log('✓ Found partial match in misc folder:', filePath);
            } else {
              // Try matching by any part of the filename
              const nameParts = fileName.split('_');
              const anyMatch = miscFiles.find(f => {
                return nameParts.some(part => f.includes(part)) || f.includes(nameParts[0]);
              });
              if (anyMatch) {
                filePath = path.join(miscPath, anyMatch);
                console.log('✓ Found filename match in misc folder:', filePath);
              }
            }
          }
        } catch (err) {
          console.error('Error searching misc folder:', err.message);
        }
      }
    }
    
    if (!filePath) {
      // Use the first calculated path for error reporting
      filePath = possiblePaths[0];
      console.error('None of the attempted paths exist:', uniquePaths);
    } else {
      console.log('✓✓✓ FINAL: Found file at:', filePath);
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('Video file not found at any attempted path');
      console.error('File path from database:', video.file_path);
      console.error('All attempted paths:', uniquePaths);
      
      // Check if any of the parent directories exist
      const checkDirs = [
        path.resolve(basePath, '..', 'video-storage'),
        uploadPath,
        miscPath
      ];
      
      const dirInfo = checkDirs.map(dir => {
        const exists = fs.existsSync(dir);
        let files = [];
        if (exists) {
          try {
            files = fs.readdirSync(dir).slice(0, 10);
          } catch (err) {
            files = ['Cannot read directory'];
          }
        }
        return { path: dir, exists, files };
      });
      
      console.error('Directory check:', dirInfo);
      
      // If misc folder exists, try to find the file by filename (LAST RESORT)
      if (fs.existsSync(miscPath)) {
        try {
          const fileName = path.basename(video.file_path); // e.g., VID_1764675366468_master.mp4
          const miscFiles = fs.readdirSync(miscPath).filter(f => 
            f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm')
          );
          console.error('Video files in misc folder:', miscFiles);
          console.error('Looking for file matching:', fileName);
          
          // Try to find exact match or partial match
          const exactMatch = miscFiles.find(f => f === fileName);
          const partialMatch = miscFiles.find(f => f.includes(fileName.split('_')[0]) || fileName.includes(f.split('_')[0]));
          
          if (exactMatch) {
            const foundPath = path.join(miscPath, exactMatch);
            console.error('✓ Found exact match in misc folder:', foundPath);
            if (fs.existsSync(foundPath)) {
              filePath = foundPath;
              console.log('✅✅✅ FILE FOUND IN MISC FOLDER:', filePath);
              // Don't return 404, continue to streaming
            } else {
              console.error('✗ Found match but file does not exist:', foundPath);
            }
          } else if (partialMatch) {
            const foundPath = path.join(miscPath, partialMatch);
            console.error('✓ Found partial match in misc folder:', foundPath);
            if (fs.existsSync(foundPath)) {
              filePath = foundPath;
              console.log('✅✅✅ FILE FOUND IN MISC FOLDER (partial match):', filePath);
              // Don't return 404, continue to streaming
            } else {
              console.error('✗ Found match but file does not exist:', foundPath);
            }
          } else {
            console.error('✗ No matching file found in misc folder');
            console.error('Available files:', miscFiles);
          }
        } catch (err) {
          console.error('Cannot read misc folder:', err.message);
        }
      }
      
      // Only return 404 if file still not found after all attempts
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ 
          error: 'Video file not found', 
          attemptedPaths: uniquePaths,
          videoId: videoId,
          filePathFromDb: video.file_path,
          uploadPath: config.upload.uploadPath,
          backendDir: path.dirname(__dirname),
          directoryCheck: dirInfo
        });
      }
    }
    
    // Verify file exists before proceeding
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Video file not found after all search attempts',
        videoId: videoId,
        filePathFromDb: video.file_path,
        lastAttemptedPath: filePath
      });
    }
    
    console.log('✅✅✅ FILE EXISTS AND READY TO STREAM:', filePath);
    
    // Check if file is readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
      console.error('Video file not readable:', filePath, err);
      return res.status(403).json({ error: 'Video file not accessible' });
    }
    
    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Detect content type from file extension
    const contentType = getContentType(filePath);
    console.log('Streaming video:', {
      videoId,
      filePath,
      fileSize,
      contentType,
      extension: path.extname(filePath)
    });
    
    // If range header is present, handle partial content
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      // Validate range
      if (start >= fileSize || end >= fileSize) {
        res.status(416).json({ error: 'Range Not Satisfiable' });
        return;
      }
      
      // Create read stream for the requested range
      const file = fs.createReadStream(filePath, { start, end });
      
      // Set headers for partial content
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range header - send full file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      };
      
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
}

