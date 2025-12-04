import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import { generateVideoId, generateVideoPath } from '../utils/videoIdGenerator.js';
import { ensureDirectoryExists, getFileSize } from '../utils/fileUtils.js';
import * as videoService from '../services/videoService.js';
import * as redirectService from '../services/redirectService.js';
import * as qrCodeService from '../services/qrCodeService.js';
import * as captionService from '../services/captionService.js';
import * as thumbnailService from '../services/thumbnailService.js';
import pool from '../config/database.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folderPath = generateVideoPath(req.body);
    const fullPath = path.join(config.upload.uploadPath, folderPath);
    
    await ensureDirectoryExists(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate a temporary filename, version will be determined in the upload handler
    const videoId = generateVideoId(req.body);
    cb(null, `${videoId}_master.mp4`);
  }
});

// Custom storage that routes to disk for video and memory for thumbnail
const customStorage = {
  _handleFile: function (req, file, cb) {
    if (file.fieldname === 'video') {
      // Use disk storage for video
      const folderPath = generateVideoPath(req.body);
      const fullPath = path.join(config.upload.uploadPath, folderPath);
      
      ensureDirectoryExists(fullPath).then(() => {
        const videoId = generateVideoId(req.body);
        const filename = `${videoId}_master.mp4`;
        const filepath = path.join(fullPath, filename);
        
        const writeStream = fsSync.createWriteStream(filepath);
        file.stream.pipe(writeStream);
        
        writeStream.on('error', (err) => cb(err));
        writeStream.on('finish', () => {
          cb(null, {
            destination: fullPath,
            filename: filename,
            path: filepath,
            size: writeStream.bytesWritten,
            originalname: file.originalname,
            mimetype: file.mimetype,
            fieldname: file.fieldname
          });
        });
      }).catch((error) => {
        cb(error);
      });
    } else if (file.fieldname === 'thumbnail') {
      // Use memory storage for thumbnail
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        cb(null, {
          buffer: buffer,
          size: buffer.length,
          originalname: file.originalname,
          mimetype: file.mimetype,
          fieldname: file.fieldname
        });
      });
      file.stream.on('error', (err) => cb(err));
    } else {
      // Ignore other non-file fields (form data) - multer will handle them
      cb(null, null);
    }
  },
  _removeFile: function (req, file, cb) {
    if (file.path && fsSync.existsSync(file.path)) {
      fsSync.unlink(file.path, cb);
    } else {
      cb(null);
    }
  }
};

// Combined multer configuration for both video and thumbnail
const combinedUpload = multer({
  storage: customStorage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only MP4, WebM, and QuickTime are allowed.'));
      }
    } else if (file.fieldname === 'thumbnail') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid thumbnail type. Only JPEG, PNG, and WebP are allowed.'));
      }
    } else {
      // Allow other fields (form data) to pass through
      cb(null, true);
    }
  }
});

export const uploadVideo = [
  // Use fields to handle both video (required) and thumbnail (optional)
  combinedUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // Handle files from multer.fields()
      const videoFile = req.files?.video?.[0];
      const thumbnailFile = req.files?.thumbnail?.[0];
      
      if (!videoFile) {
        return res.status(400).json({ error: 'Video file required' });
      }
      
      // Store files in req for easier access
      req.file = videoFile;
      req.thumbnailFile = thumbnailFile || null;
      
      // Verify video file exists on disk
      try {
        await fs.access(videoFile.path);
      } catch (accessError) {
        console.error('Uploaded file not found on disk:', videoFile.path);
        return res.status(500).json({ error: 'Uploaded file could not be found on server' });
      }
      
      console.log('Upload started for file:', videoFile.originalname || 'video');
      console.log('File path:', videoFile.path);
      console.log('File size:', videoFile.size);
      if (thumbnailFile) {
        console.log('Thumbnail uploaded:', thumbnailFile.originalname, 'Size:', thumbnailFile.size);
      }
      
      const { 
        course, grade, lesson, module, activity,
        topic, title, description, language 
      } = req.body;
      
      console.log('Form data:', { course, grade, lesson, module, activity, topic, title });
      
      // Generate video ID from available fields
      const videoId = generateVideoId(req.body);
      console.log('Generated video ID:', videoId);
      
      const latestVersion = await videoService.getLatestVersion(videoId).catch(() => 1);
      console.log('Latest version:', latestVersion);
      
      // Get file size
      const size = await getFileSize(videoFile.path);
      console.log('File size:', size);
      
      // Get video duration (simplified - in production, use ffprobe)
      let duration = 0;
      try {
        // This is a placeholder - in production, use ffprobe to get actual duration
        duration = 0; // Will be updated when ffprobe is properly configured
      } catch (error) {
        console.error('Error getting video duration:', error);
      }
      
      // Build file paths with version
      const folderPath = generateVideoPath(req.body);
      console.log('Folder path:', folderPath);
      
      const versionStr = latestVersion > 1 ? `_v${String(latestVersion).padStart(2, '0')}` : '';
      const filename = videoFile.filename.replace('_master.mp4', `${versionStr}_master.mp4`);
      const relativePath = path.join(
        folderPath,
        filename
      ).replace(/\\/g, '/');
      
      console.log('Relative path:', relativePath);
      
      // Rename file if version > 1
      if (latestVersion > 1) {
        const oldPath = videoFile.path;
        const newPath = path.join(path.dirname(oldPath), filename);
        await fs.rename(oldPath, newPath);
        console.log('File renamed for version:', latestVersion);
      }
      
      const streamingUrl = videoService.buildStreamingUrl(relativePath, videoId);
      const redirectSlug = videoId;
      // Redirect to stream page so users can directly watch the video
      const redirectUrl = `${config.urls.frontend}/stream/${videoId}`;
      
      console.log('Creating redirect with short URL to stream page...');
      // Create redirect with short URL
      const redirectResult = await redirectService.createRedirect(redirectSlug, redirectUrl, true);
      const shortUrl = redirectResult.shortUrl || redirectUrl;
      const shortSlug = redirectResult.shortSlug || redirectSlug;
      
      console.log('Generating QR code with short URL...');
      // Generate QR code with short URL
      const qrUrl = await qrCodeService.generateQRCode(videoId, shortUrl);
      
      // Handle thumbnail: use uploaded thumbnail if provided, otherwise generate from video
      let thumbnailUrl = null;
      try {
        // Check for uploaded thumbnail - try multiple ways to access it
        let thumbnailFile = req.thumbnailFile;
        
        // If not found, try accessing from req.files directly
        if (!thumbnailFile && req.files && req.files.thumbnail) {
          thumbnailFile = req.files.thumbnail[0];
          console.log('Thumbnail found in req.files.thumbnail[0]');
        }
        
        console.log('Thumbnail file check:', {
          hasThumbnailFile: !!thumbnailFile,
          hasBuffer: !!(thumbnailFile?.buffer),
          originalname: thumbnailFile?.originalname,
          fieldname: thumbnailFile?.fieldname,
          size: thumbnailFile?.size
        });
        
        if (thumbnailFile && thumbnailFile.buffer) {
          // Use uploaded custom thumbnail
          console.log('Saving uploaded custom thumbnail...');
          console.log('Thumbnail details:', {
            originalname: thumbnailFile.originalname,
            mimetype: thumbnailFile.mimetype,
            size: thumbnailFile.size,
            bufferSize: thumbnailFile.buffer.length
          });
          
          // Add originalname if not present
          if (!thumbnailFile.originalname) {
            thumbnailFile.originalname = 'thumbnail.jpg';
          }
          
          thumbnailUrl = await thumbnailService.saveUploadedThumbnail(thumbnailFile, videoId);
          console.log('Custom thumbnail saved successfully:', thumbnailUrl);
        } else {
          // Generate thumbnail from video (non-blocking - don't fail upload if thumbnail fails)
          console.log('No custom thumbnail provided, generating from video...');
          const fullVideoPath = path.join(config.upload.uploadPath, relativePath);
          console.log('Generating thumbnail from video:', fullVideoPath);
          thumbnailUrl = await thumbnailService.generateThumbnail(fullVideoPath, videoId);
          console.log('Thumbnail generated from video:', thumbnailUrl);
        }
      } catch (thumbnailError) {
        console.warn('Thumbnail processing failed (non-critical):', thumbnailError.message);
        console.warn('Thumbnail error stack:', thumbnailError.stack);
        // Continue without thumbnail - upload should still succeed
      }
      
      // Create video entry
      const videoData = {
        videoId,
        title: title || videoFile.originalname || 'Untitled Video',
        course: course || null,
        grade: grade || null,
        lesson: lesson || null,
        module: module || null,
        activity: activity || null,
        topic: topic || null,
        description: description || '',
        language: language || 'en',
        filePath: relativePath,
        streamingUrl,
        qrUrl,
        thumbnailUrl: thumbnailUrl || null,
        redirectSlug: shortSlug, // Use short slug for redirect
        duration,
        size,
        version: latestVersion,
        status: 'active'
      };
      
      console.log('Creating video entry in database...');
      console.log('Video data being saved:', {
        videoId,
        title: videoData.title,
        thumbnailUrl: videoData.thumbnailUrl,
        filePath: videoData.filePath
      });
      const videoDbId = await videoService.createVideo(videoData);
      console.log('Video created with ID:', videoDbId);
      
      // Create version entry
      await videoService.createVideoVersion(videoId, latestVersion, relativePath, size);
      
      // Get created video
      const video = await videoService.getVideoById(videoDbId);
      
      console.log('Upload completed successfully');
      res.status(201).json({
        message: 'Video uploaded successfully',
        video
      });
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Clean up uploaded file if it exists and error occurred
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path).catch(() => {
            // Ignore cleanup errors
          });
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file:', cleanupError.message);
        }
      }
      
      res.status(500).json({ 
        error: error.message || 'Upload failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
];

/**
 * Get video by ID
 */
export async function getVideo(req, res) {
  try {
    const { videoId } = req.params;
    // Try to get active video first
    let video = await videoService.getVideoByVideoId(videoId, false);
    
    // If not found, try including inactive videos for diagnostic purposes
    if (!video) {
      video = await videoService.getVideoByVideoId(videoId, true);
      if (video) {
        console.log(`Video found but status is "${video.status}" instead of "active"`);
      }
    }
    
    if (!video) {
      return res.status(404).json({ 
        error: 'Video not found',
        videoId: videoId,
        suggestion: 'Video may not exist or status may not be "active"'
      });
    }
    
    // Get captions
    const captions = await captionService.getCaptionsByVideoId(videoId);
    
    // Get related videos
    const relatedVideos = await videoService.getAllVideos({
      grade: video.grade,
      unit: video.unit
    });
    
    res.json({
      ...video,
      captions,
      relatedVideos: relatedVideos.filter(v => v.video_id !== videoId).slice(0, 5)
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
}

/**
 * Get all videos
 */
export async function getAllVideos(req, res) {
  try {
    const { search, course, grade, lesson, module, activity, unit, status } = req.query;
    const filters = {};
    
    if (search) filters.search = search;
    if (course) filters.course = course;
    if (grade) filters.grade = grade;
    if (lesson) filters.lesson = lesson;
    if (module) filters.module = module;
    if (activity) filters.activity = activity;
    if (unit) filters.unit = parseInt(unit);
    if (status) filters.status = status;
    
    const videos = await videoService.getAllVideos(filters);
    res.json(videos);
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
}

/**
 * Get unique filter values for dropdowns
 */
export async function getFilterValues(req, res) {
  try {
    const filterValues = await videoService.getFilterValues();
    res.json(filterValues);
  } catch (error) {
    console.error('Get filter values error:', error);
    res.status(500).json({ error: 'Failed to fetch filter values' });
  }
}

/**
 * Update video metadata
 */
export async function updateVideo(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const success = await videoService.updateVideo(id, updates);
    
    if (!success) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = await videoService.getVideoById(id);
    res.json(video);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
}

/**
 * Delete video - removes file from storage and all related data from database
 */
export async function deleteVideo(req, res) {
  try {
    const { id } = req.params;
    
    // First, get the video record to get file paths and videoId
    const video = await videoService.getVideoById(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const { video_id: videoId, file_path: filePath, thumbnail_url: thumbnailUrl } = video;
    
    console.log('Deleting video:', { id, videoId, filePath });
    
    // 1. Delete video file from storage
    try {
      const basePath = path.dirname(__dirname);
      const uploadPath = path.isAbsolute(config.upload.uploadPath) 
        ? config.upload.uploadPath 
        : path.resolve(basePath, config.upload.uploadPath);
      
      // Try multiple path resolution strategies (same as streaming)
      const possiblePaths = [];
      
      // Strategy 1: Direct path from database
      if (path.isAbsolute(filePath)) {
        possiblePaths.push(filePath);
      } else {
        possiblePaths.push(path.join(uploadPath, filePath));
      }
      
      // Strategy 2: Try misc folder
      const miscPath = path.join(uploadPath, 'misc');
      const fileName = path.basename(filePath);
      possiblePaths.push(path.join(miscPath, fileName));
      
      // Strategy 3: If file_path includes misc, try direct join
      if (filePath.includes('misc') || filePath.includes('MISC')) {
        possiblePaths.push(path.join(uploadPath, filePath));
        possiblePaths.push(path.join(miscPath, fileName));
      }
      
      // Find and delete the first existing file
      for (const filePathToDelete of possiblePaths) {
        try {
          const normalizedPath = path.normalize(filePathToDelete);
          await fs.access(normalizedPath);
          // File exists, delete it
          await fs.unlink(normalizedPath);
          console.log('✓ Deleted video file:', normalizedPath);
          break; // File found and deleted, exit loop
        } catch (err) {
          // File doesn't exist at this path, try next
          continue;
        }
      }
      
      // If still not found, try searching misc folder by filename
      if (fsSync.existsSync(miscPath)) {
        try {
          const miscFiles = await fs.readdir(miscPath);
          const matchingFile = miscFiles.find(f => 
            f === fileName || f.includes(videoId) || f.startsWith(videoId.split('_')[0])
          );
          
          if (matchingFile) {
            const fileToDelete = path.join(miscPath, matchingFile);
            await fs.unlink(fileToDelete);
            console.log('✓ Deleted video file from misc:', fileToDelete);
          }
        } catch (err) {
          console.warn('Could not search misc folder:', err.message);
        }
      }
    } catch (error) {
      console.error('Error deleting video file:', error.message);
      // Continue with database deletion even if file deletion fails
    }
    
    // 2. Delete thumbnail file
    if (thumbnailUrl) {
      try {
        const basePath = path.dirname(__dirname);
        const thumbnailPath = path.join(basePath, '..', 'video-storage', 'thumbnails', `${videoId}.jpg`);
        await fs.unlink(thumbnailPath);
        console.log('✓ Deleted thumbnail:', thumbnailPath);
      } catch (error) {
        console.warn('Thumbnail file not found or already deleted:', error.message);
      }
    }
    
    // 3. Delete QR code file
    try {
      const basePath = path.dirname(__dirname);
      const qrCodePath = path.join(basePath, '..', 'qr-codes', `${videoId}.png`);
      await fs.unlink(qrCodePath);
      console.log('✓ Deleted QR code:', qrCodePath);
    } catch (error) {
      console.warn('QR code file not found or already deleted:', error.message);
    }
    
    // 4. Delete all caption files and database records
    try {
      const captions = await captionService.getCaptionsByVideoId(videoId);
      for (const caption of captions) {
        try {
          const basePath = path.dirname(__dirname);
          const captionPath = path.join(basePath, '..', 'video-storage', caption.file_path);
          await fs.unlink(captionPath);
          console.log('✓ Deleted caption file:', captionPath);
        } catch (error) {
          console.warn('Caption file not found:', error.message);
        }
      }
      
      // Delete caption records from database
      const deleteCaptionsQuery = 'DELETE FROM captions WHERE video_id = ?';
      await pool.execute(deleteCaptionsQuery, [videoId]);
      console.log('✓ Deleted caption records from database');
    } catch (error) {
      console.error('Error deleting captions:', error.message);
    }
    
    // 5. Delete video versions from database
    try {
      const deleteVersionsQuery = 'DELETE FROM video_versions WHERE video_id = ?';
      await pool.execute(deleteVersionsQuery, [videoId]);
      console.log('✓ Deleted video versions from database');
    } catch (error) {
      console.error('Error deleting video versions:', error.message);
    }
    
    // 6. Delete redirect from database
    try {
      await redirectService.deleteRedirect(videoId);
      console.log('✓ Deleted redirect from database');
    } catch (error) {
      console.warn('Redirect not found or already deleted:', error.message);
    }
    
    // 7. Delete video record from database (hard delete)
    const deleteQuery = 'DELETE FROM videos WHERE id = ?';
    const [result] = await pool.execute(deleteQuery, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Video not found in database' });
    }
    
    console.log('✓ Deleted video record from database');
    
    res.json({ 
      message: 'Video and all related files deleted successfully',
      deleted: {
        video: true,
        thumbnail: !!thumbnailUrl,
        qrCode: true,
        captions: true,
        versions: true,
        redirect: true
      }
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video', details: error.message });
  }
}

/**
 * Get video versions
 */
export async function getVideoVersions(req, res) {
  try {
    const { videoId } = req.params;
    const versions = await videoService.getVideoVersions(videoId);
    res.json(versions);
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
}

/**
 * Download QR code as PNG file
 */
export async function downloadQRCode(req, res) {
  try {
    const { videoId } = req.params;
    console.log(`[Download QR] Request for videoId: ${videoId}`);
    
    // Get video to get redirect URL
    const video = await videoService.getVideoByVideoId(videoId, true);
    if (!video) {
      console.error(`[Download QR] Video not found: ${videoId}`);
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Build short URL
    const shortUrl = video.redirect_slug 
      ? `${config.urls.base}/${video.redirect_slug}`
      : `${config.urls.base}/${video.video_id}`;
    
    console.log(`[Download QR] Short URL: ${shortUrl}`);
    
    // Try to download existing QR code, or generate if it doesn't exist
    let qrBuffer;
    try {
      qrBuffer = await qrCodeService.downloadQRCode(videoId);
      console.log(`[Download QR] Found existing QR code for ${videoId}`);
    } catch (error) {
      // QR code doesn't exist, generate it
      console.log(`[Download QR] QR code not found for ${videoId}, generating...`);
      try {
        await qrCodeService.generateQRCode(videoId, shortUrl);
        console.log(`[Download QR] Successfully generated QR code for ${videoId}`);
        qrBuffer = await qrCodeService.downloadQRCode(videoId);
      } catch (genError) {
        console.error(`[Download QR] Error generating QR code:`, genError);
        throw new Error(`Failed to generate QR code: ${genError.message}`);
      }
    }
    
    if (!qrBuffer) {
      throw new Error('QR code buffer is empty');
    }
    
    console.log(`[Download QR] Sending QR code for ${videoId}, size: ${qrBuffer.length} bytes`);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${videoId}_qr_code.png"`);
    res.send(qrBuffer);
  } catch (error) {
    console.error('[Download QR] Error:', error);
    console.error('[Download QR] Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate or download QR code', 
        message: error.message,
        videoId: req.params.videoId
      });
    }
  }
}

/**
 * Get all videos with QR codes and short URLs
 */
export async function getAllQRCodes(req, res) {
  try {
    const videos = await videoService.getAllVideos({ status: 'active' });
    
    // Enrich with short URLs and QR code info
    const qrCodes = videos.map(video => {
      const shortUrl = video.redirect_slug 
        ? `${config.urls.base}/${video.redirect_slug}`
        : `${config.urls.base}/${video.video_id}`;
      
      return {
        videoId: video.video_id,
        title: video.title || 'Untitled Video',
        course: video.course,
        grade: video.grade,
        lesson: video.lesson,
        module: video.module,
        activity: video.activity,
        topic: video.topic,
        language: video.language || 'en',
        shortUrl,
        shortSlug: video.redirect_slug || video.video_id,
        qrUrl: video.qr_url,
        createdAt: video.created_at,
        updatedAt: video.updated_at
      };
    });
    
    res.json(qrCodes);
  } catch (error) {
    console.error('Get all QR codes error:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
}

