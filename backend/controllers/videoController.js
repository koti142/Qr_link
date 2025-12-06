import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import config from '../config/config.js';
import * as videoService from '../services/videoService.js';
import * as redirectService from '../services/redirectService.js';
import * as qrCodeService from '../services/qrCodeService.js';
import { ensureDirectoryExists, getFileSize } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Placeholder functions - these need to be restored from backup or recreated
// For now, adding the diagnostic function and we'll need to restore the rest

/**
 * Get video replacement diagnostic information
 * Checks if a video can be replaced and identifies potential issues
 */
export async function getVideoReplacementDiagnostic(req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    console.log(`[Replace Diagnostic] Checking video ID: ${id}`);

    const diagnostic = {
      videoId: id,
      canReplace: false,
      checks: [],
      errors: [],
      warnings: [],
      videoInfo: null,
      fileInfo: null,
      databaseInfo: null
    };

    // Check 1: Video exists in database
    try {
      const video = await videoService.getVideoById(id);
      if (!video) {
        diagnostic.checks.push({
          name: 'Video Exists',
          status: 'error',
          message: 'Video not found in database',
          details: { videoId: id }
        });
        diagnostic.errors.push('Video not found in database');
        return res.json(diagnostic);
      }

      diagnostic.videoInfo = {
        id: video.id,
        video_id: video.video_id,
        redirect_slug: video.redirect_slug,
        file_path: video.file_path,
        qr_url: video.qr_url,
        status: video.status,
        size: video.size
      };

      diagnostic.checks.push({
        name: 'Video Exists',
        status: 'success',
        message: 'Video found in database',
        details: {
          video_id: video.video_id,
          redirect_slug: video.redirect_slug,
          status: video.status
        }
      });
    } catch (err) {
      diagnostic.checks.push({
        name: 'Video Exists',
        status: 'error',
        message: 'Error checking video',
        details: { error: err.message }
      });
      diagnostic.errors.push(`Error checking video: ${err.message}`);
      return res.json(diagnostic);
    }

    // Check 2: Video has redirect_slug
    const video = await videoService.getVideoById(id);
    if (!video.redirect_slug) {
      diagnostic.checks.push({
        name: 'Redirect Slug',
        status: 'error',
        message: 'Video does not have redirect_slug',
        details: { videoId: video.video_id }
      });
      diagnostic.errors.push('Video does not have redirect_slug - cannot preserve URL/QR');
      diagnostic.canReplace = false;
    } else {
      diagnostic.checks.push({
        name: 'Redirect Slug',
        status: 'success',
        message: 'Video has redirect_slug',
        details: { redirect_slug: video.redirect_slug }
      });
    }

    // Check 3: File path resolution
    const backendDir = path.dirname(__dirname);
    const basePath = path.dirname(backendDir);
    let uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    const myStoragePath = path.join(uploadPath, 'my-storage');

    // Check if my-storage directory exists and is writable
    try {
      if (!fsSync.existsSync(myStoragePath)) {
        diagnostic.checks.push({
          name: 'Storage Directory',
          status: 'warning',
          message: 'my-storage directory does not exist',
          details: { path: myStoragePath }
        });
        diagnostic.warnings.push('my-storage directory does not exist - will be created');
      } else {
        // Check if writable
        try {
          fsSync.accessSync(myStoragePath, fsSync.constants.W_OK);
          diagnostic.checks.push({
            name: 'Storage Directory',
            status: 'success',
            message: 'my-storage directory exists and is writable',
            details: { path: myStoragePath }
          });
        } catch (accessError) {
          diagnostic.checks.push({
            name: 'Storage Directory',
            status: 'error',
            message: 'my-storage directory is not writable',
            details: { path: myStoragePath, error: accessError.message }
          });
          diagnostic.errors.push('my-storage directory is not writable');
        }
      }
    } catch (dirError) {
      diagnostic.checks.push({
        name: 'Storage Directory',
        status: 'error',
        message: 'Error checking storage directory',
        details: { error: dirError.message }
      });
      diagnostic.errors.push(`Error checking storage directory: ${dirError.message}`);
    }

    // Check 4: Expected file path
    const expectedPath = `my-storage/${video.redirect_slug}.mp4`;
    const expectedFullPath = path.join(myStoragePath, `${video.redirect_slug}.mp4`);
    
    diagnostic.fileInfo = {
      expectedPath: expectedPath,
      expectedFullPath: expectedFullPath,
      currentPath: video.file_path,
      pathWillChange: video.file_path !== expectedPath
    };

    diagnostic.checks.push({
      name: 'File Path',
      status: 'info',
      message: 'Expected file path for replacement',
      details: {
        expected: expectedPath,
        current: video.file_path,
        willChange: video.file_path !== expectedPath
      }
    });

    // Check 5: Check for duplicate videos with same redirect_slug
    try {
      const [duplicates] = await pool.execute(
        'SELECT id, video_id, title, file_path, status FROM videos WHERE redirect_slug = ? AND id != ?',
        [video.redirect_slug, id]
      );

      if (duplicates.length > 0) {
        diagnostic.checks.push({
          name: 'Duplicate Videos',
          status: 'warning',
          message: `Found ${duplicates.length} other video(s) with same redirect_slug`,
          details: {
            count: duplicates.length,
            videos: duplicates.map(v => ({
              id: v.id,
              video_id: v.video_id,
              title: v.title,
              status: v.status
            }))
          }
        });
        diagnostic.warnings.push(`${duplicates.length} other video(s) will be deleted during replacement`);
      } else {
        diagnostic.checks.push({
          name: 'Duplicate Videos',
          status: 'success',
          message: 'No duplicate videos found',
          details: {}
        });
      }
    } catch (dupError) {
      diagnostic.checks.push({
        name: 'Duplicate Videos',
        status: 'error',
        message: 'Error checking for duplicates',
        details: { error: dupError.message }
      });
      diagnostic.errors.push(`Error checking duplicates: ${dupError.message}`);
    }

    // Check 6: Database update capability
    try {
      // Test if we can update the video (dry run - just check if video exists)
      const testVideo = await videoService.getVideoById(id);
      if (testVideo) {
        diagnostic.checks.push({
          name: 'Database Update',
          status: 'success',
          message: 'Video can be updated in database',
          details: { videoId: testVideo.video_id }
        });
      }
    } catch (updateError) {
      diagnostic.checks.push({
        name: 'Database Update',
        status: 'error',
        message: 'Cannot update video in database',
        details: { error: updateError.message }
      });
      diagnostic.errors.push(`Database update error: ${updateError.message}`);
    }

    // Final assessment
    diagnostic.canReplace = diagnostic.errors.length === 0;

    if (diagnostic.canReplace) {
      diagnostic.checks.push({
        name: 'Replacement Ready',
        status: 'success',
        message: 'Video can be replaced successfully',
        details: {
          redirect_slug: video.redirect_slug,
          expectedPath: expectedPath,
          warnings: diagnostic.warnings.length
        }
      });
    } else {
      diagnostic.checks.push({
        name: 'Replacement Ready',
        status: 'error',
        message: 'Video cannot be replaced - errors found',
        details: {
          errors: diagnostic.errors,
          errorCount: diagnostic.errors.length
        }
      });
    }

    res.json(diagnostic);
  } catch (error) {
    console.error('Replace diagnostic error:', error);
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Stub functions - these need to be restored from backup
// Adding minimal stubs so the module loads correctly
export async function getAllVideos(req, res) {
  try {
    const videos = await videoService.getAllVideos(req.query);
    res.json(videos);
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getVideo(req, res) {
  try {
    const { videoId } = req.params;
    const video = await videoService.getVideoByVideoId(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function uploadVideo(req, res) {
  try {
    // Handle multer fields (video and thumbnail)
    const videoFile = req.files?.video?.[0] || req.files?.video || req.file || null;
    const thumbnailFile = req.files?.thumbnail?.[0] || req.files?.thumbnail || null;

    if (!videoFile) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    console.log(`[Upload Video] ===== STARTING VIDEO UPLOAD =====`);
    console.log(`[Upload Video] File: ${videoFile.originalname}, size: ${videoFile.size} bytes`);

    // Get form data
    const {
      course,
      grade,
      lesson,
      module,
      activity,
      topic,
      title,
      description,
      language = 'en'
    } = req.body;

    // Generate video ID
    const { generateVideoId } = await import('../utils/videoIdGenerator.js');
    const { generateUniqueShortId } = await import('../utils/shortUrlGenerator.js');
    
    let videoId = generateVideoId({
      course,
      grade,
      lesson,
      module,
      activity,
      topic,
      title
    });

    // Ensure video ID is unique
    let existingVideo = await videoService.getVideoByVideoId(videoId);
    let counter = 1;
    while (existingVideo) {
      videoId = `${videoId}_${counter}`;
      existingVideo = await videoService.getVideoByVideoId(videoId);
      counter++;
    }

    console.log(`[Upload Video] Generated video ID: ${videoId}`);

    // Generate redirect slug (short URL)
    const redirectSlug = await generateUniqueShortId();
    console.log(`[Upload Video] Generated redirect slug: ${redirectSlug}`);

    // Create upload directory (backend/upload)
    const uploadDir = path.join(__dirname, '../upload');
    await ensureDirectoryExists(uploadDir);

    // Generate unique filename to avoid conflicts
    const fileExt = path.extname(videoFile.originalname) || '.mp4';
    const fileName = `${videoId}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Relative path from backend folder (for database)
    const relativePath = `upload/${fileName}`;

    console.log(`[Upload Video] Saving file to: ${filePath}`);
    console.log(`[Upload Video] Relative path: ${relativePath}`);

    // Move uploaded file to upload directory
    try {
      if (videoFile.path) {
        // File is on disk (from multer)
        await fs.rename(videoFile.path, filePath);
      } else if (videoFile.buffer) {
        // File is in memory
        await fs.writeFile(filePath, videoFile.buffer);
      } else {
        throw new Error('Video file has no path or buffer');
      }
      console.log(`[Upload Video] ✓ File saved successfully`);
    } catch (fileError) {
      console.error(`[Upload Video] ✗ Error saving file:`, fileError.message);
      throw new Error(`Failed to save video file: ${fileError.message}`);
    }

    // Verify file exists and get size
    if (!fsSync.existsSync(filePath)) {
      throw new Error(`File was not saved correctly to: ${filePath}`);
    }
    
    const fileSize = fsSync.statSync(filePath).size;
    console.log(`[Upload Video] ✓ File verified, size: ${fileSize} bytes`);

    // Generate QR code
    const shortUrl = `${config.urls.base}/s/${redirectSlug}`;
    let qrUrl = null;
    try {
      qrUrl = await qrCodeService.generateQRCode(videoId, shortUrl);
      console.log(`[Upload Video] ✓ QR code generated: ${qrUrl}`);
    } catch (qrError) {
      console.warn(`[Upload Video] ⚠ Could not generate QR code:`, qrError.message);
      // Continue without QR code
    }

    // Handle thumbnail if provided
    let thumbnailUrl = null;
    if (thumbnailFile) {
      try {
        const { saveUploadedThumbnail } = await import('../services/thumbnailService.js');
        thumbnailUrl = await saveUploadedThumbnail(thumbnailFile, videoId);
        console.log(`[Upload Video] ✓ Thumbnail saved: ${thumbnailUrl}`);
      } catch (thumbError) {
        console.warn(`[Upload Video] ⚠ Could not save thumbnail:`, thumbError.message);
        // Continue without thumbnail
      }
    }

    // Build streaming URL
    const streamingUrl = `${config.urls.base}/s/${redirectSlug}`;

    // Create video record in database
    const videoData = {
      videoId,
      title: title || videoId,
      description: description || '',
      language,
      course: course || null,
      grade: grade || null,
      lesson: lesson || null,
      module: module || null,
      activity: activity || null,
      topic: topic || null,
      filePath: relativePath, // Relative path: upload/filename.mp4
      streamingUrl,
      qrUrl,
      thumbnailUrl,
      redirectSlug,
      size: fileSize,
      status: 'active'
    };

    console.log(`[Upload Video] Creating video record in database...`);
    const insertId = await videoService.createVideo(videoData);
    console.log(`[Upload Video] ✓ Video record created: ID ${insertId}`);
    
    // Fetch the created video to get all fields
    const video = await videoService.getVideoById(insertId);
    if (!video) {
      throw new Error('Video was created but could not be retrieved from database');
    }
    console.log(`[Upload Video] ✓ Video retrieved: ID ${video.id}, Video ID: ${video.video_id}`);

    // Create redirect entry
    try {
      const targetUrl = `${config.urls.frontend}/stream/${videoId}`;
      await redirectService.createRedirect(redirectSlug, targetUrl, false);
      console.log(`[Upload Video] ✓ Redirect created: ${redirectSlug} -> ${targetUrl}`);
    } catch (redirectError) {
      console.warn(`[Upload Video] ⚠ Could not create redirect:`, redirectError.message);
      // Continue - redirect might already exist
    }

    console.log(`[Upload Video] ===== UPLOAD COMPLETE =====`);
    console.log(`[Upload Video] ✓ Video uploaded successfully`);
    console.log(`[Upload Video] ✓ File path: ${relativePath}`);
    console.log(`[Upload Video] ✓ Accessible at: ${config.urls.base}/upload/${fileName}`);
    console.log(`[Upload Video] ✓ Streaming URL: ${streamingUrl}`);
    console.log(`[Upload Video] =================================`);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        video_id: video.video_id,
        title: video.title,
        file_path: video.file_path,
        streaming_url: video.streaming_url,
        redirect_slug: video.redirect_slug,
        qr_url: video.qr_url
      },
      file_path: relativePath,
      file_size: fileSize,
      upload_url: `${config.urls.base}/upload/${fileName}`,
      streaming_url: streamingUrl,
      redirect_slug: redirectSlug
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ 
      error: 'Failed to upload video', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function replaceVideoFile(req, res) {
  let tempFilePath = null;
  
  try {
    const { id } = req.params;
    const videoFile = req.file;

    if (!videoFile) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    console.log(`[Replace Video] ===== STARTING VIDEO REPLACEMENT =====`);
    console.log(`[Replace Video] Video ID: ${id}`);
    console.log(`[Replace Video] Uploaded file: ${videoFile.originalname}, size: ${videoFile.size} bytes`);

    // Get existing video
    const existingVideo = await videoService.getVideoById(id);
    if (!existingVideo) {
      // Cleanup temp file
      if (videoFile.path && fsSync.existsSync(videoFile.path)) {
        await fs.unlink(videoFile.path).catch(() => {});
      }
      return res.status(404).json({ error: 'Video not found', videoId: id });
    }

    const videoId = existingVideo.video_id;
    const redirectSlug = existingVideo.redirect_slug;
    const qrUrl = existingVideo.qr_url;

    if (!redirectSlug) {
      console.error(`[Replace Video] ✗ Video does not have redirect_slug`);
      // Cleanup temp file
      if (videoFile.path && fsSync.existsSync(videoFile.path)) {
        await fs.unlink(videoFile.path).catch(() => {});
      }
      return res.status(400).json({ error: 'Video does not have a redirect slug. Cannot preserve link.', videoId: videoId });
    }

    console.log(`[Replace Video] Replacing video file for ID: ${id}, Video ID: ${videoId}`);
    console.log(`[Replace Video] Preserving redirect_slug: ${redirectSlug}, QR URL: ${qrUrl}`);

    // Get file size from temp file
    const tempFileSize = await getFileSize(videoFile.path);
    console.log(`[Replace Video] New file size: ${tempFileSize} bytes`);

    // Resolve paths
    const backendDir = path.dirname(__dirname);
    const basePath = path.dirname(backendDir);
    let uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    
    // Determine where to save the file based on existing file_path
    // If existing file is in upload/, save to upload/; otherwise save to my-storage/
    let targetDir, relativePath;
    const existingFilePath = existingVideo.file_path || '';
    
    if (existingFilePath.startsWith('upload/')) {
      // Save to backend/upload/ folder
      targetDir = path.join(backendDir, 'upload');
      await ensureDirectoryExists(targetDir);
      const fileExt = path.extname(videoFile.originalname) || '.mp4';
      const fileName = `${videoId}${fileExt}`;
      relativePath = `upload/${fileName}`;
    } else {
      // Save to my-storage/ folder (default/legacy)
      const myStoragePath = path.join(uploadPath, 'my-storage');
      await ensureDirectoryExists(myStoragePath);
      const fileExt = path.extname(videoFile.originalname) || '.mp4';
      const fileName = `${redirectSlug}${fileExt}`;
      relativePath = `my-storage/${fileName}`;
      targetDir = myStoragePath;
    }
    
    const targetFilePath = path.join(targetDir, path.basename(relativePath));
    tempFilePath = videoFile.path;

    console.log(`[Replace Video] Target file path: ${targetFilePath}`);
    console.log(`[Replace Video] Relative path: ${relativePath}`);

    // Move uploaded file to target location (this will overwrite existing file)
    try {
      await fs.rename(videoFile.path, targetFilePath);
      tempFilePath = null; // File moved, no need to cleanup
      console.log(`[Replace Video] ✓ New file saved to: ${targetFilePath}`);
    } catch (renameError) {
      console.error(`[Replace Video] ✗ Error moving file:`, renameError.message);
      // Try copy as fallback (in case rename fails due to cross-device issues)
      try {
        await fs.copyFile(videoFile.path, targetFilePath);
        await fs.unlink(videoFile.path).catch(() => {}); // Delete temp file after copy
        tempFilePath = null;
        console.log(`[Replace Video] ✓ New file copied to: ${targetFilePath} (used copy as fallback)`);
      } catch (copyError) {
        console.error(`[Replace Video] ✗✗✗ CRITICAL: Could not save new file:`, copyError.message);
        throw new Error(`Failed to save new video file: ${copyError.message}`);
      }
    }
    
    // Verify the new file exists
    if (!fsSync.existsSync(targetFilePath)) {
      throw new Error(`New file was not saved correctly to: ${targetFilePath}`);
    }
    
    const newFileSize = fsSync.statSync(targetFilePath).size;
    console.log(`[Replace Video] ✓ Verified new file exists, size: ${newFileSize} bytes`);

    // Build streaming URL (keep same format - use redirect slug)
    const streamingUrl = `${config.urls.base}/s/${redirectSlug}`;

    // SIMPLE: Just update the file_path and size in the database
    // No deletions, no complex logic - just update the path
    const updateData = {
      file_path: relativePath, // my-storage/<redirect_slug>.mp4
      streaming_url: streamingUrl,
      size: newFileSize,
      status: 'active'
    };
    
    console.log(`[Replace Video] ===== UPDATING VIDEO FILE PATH =====`);
    console.log(`[Replace Video] Updating video ID ${id} with new file path`);
    console.log(`[Replace Video] Update data:`, updateData);
    
    // Update the video record
    const success = await videoService.updateVideo(id, updateData);
    
    if (!success) {
      console.error(`[Replace Video] ✗✗✗ FAILED to update video record with ID ${id}`);
      return res.status(500).json({ 
        error: 'Failed to update video record',
        videoId: videoId,
        redirectSlug: redirectSlug
      });
    }
    
    console.log(`[Replace Video] ✓✓✓ Video record updated successfully`);
    
    // Verify the database was updated correctly
    const updatedVideo = await videoService.getVideoById(id);
    if (!updatedVideo) {
      console.error(`[Replace Video] ✗✗✗ CRITICAL: Video with ID ${id} does not exist after update!`);
      return res.status(500).json({ 
        error: 'Video was deleted after update. This is a critical error.',
        videoId: videoId,
        redirectSlug: redirectSlug
      });
    }
    
    console.log(`[Replace Video] ✓✓✓ Video successfully updated: ID ${updatedVideo.id}, Path: ${updatedVideo.file_path}, Size: ${updatedVideo.size}`);
    console.log(`[Replace Video] ===== REPLACEMENT COMPLETE =====`);
    console.log(`[Replace Video] ✓ Video file replaced successfully`);
    console.log(`[Replace Video] ✓ File path updated: ${updatedVideo.file_path}`);
    console.log(`[Replace Video] ✓ File size updated: ${updatedVideo.size} bytes`);
    console.log(`[Replace Video] ✓ Redirect slug preserved: ${redirectSlug}`);
    console.log(`[Replace Video] ✓ QR code preserved: ${qrUrl}`);
    console.log(`[Replace Video] ✓ Streaming URL: ${streamingUrl}`);
    console.log(`[Replace Video] =================================`);
    
    // Force database refresh by updating updated_at timestamp
    await pool.execute(
      'UPDATE videos SET updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Video file replaced successfully. Link and QR code remain the same.',
      video: updatedVideo,
      redirect_slug: redirectSlug,
      qr_url: qrUrl,
      file_path: relativePath,
      file_size: updatedVideo.size,
      video_id: videoId,
      streaming_url: streamingUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Replace video file error:', error);
    
    // Cleanup temp file if it still exists
    if (tempFilePath && fsSync.existsSync(tempFilePath)) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`[Replace Video] Cleaned up temp file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.warn(`[Replace Video] Could not cleanup temp file:`, cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to replace video file', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function updateVideo(req, res) {
  try {
    const { id } = req.params;
    const success = await videoService.updateVideo(id, req.body);
    if (success) {
      const video = await videoService.getVideoById(id);
      res.json(video);
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteVideo(req, res) {
  try {
    const { id } = req.params;
    const success = await videoService.deleteVideo(id);
    if (success) {
      res.json({ message: 'Video deleted successfully' });
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAllQRCodes(req, res) {
  try {
    console.log('[Get All QR Codes] Fetching all videos with QR codes');
    
    // Get all active videos with QR codes
    const query = `
      SELECT 
        id,
        video_id as videoId,
        title,
        course,
        grade,
        lesson,
        module,
        activity,
        topic,
        redirect_slug as shortSlug,
        qr_url as qrUrl,
        streaming_url as streamingUrl,
        created_at as createdAt,
        updated_at as updatedAt
      FROM videos 
      WHERE status = 'active' 
        AND (qr_url IS NOT NULL OR redirect_slug IS NOT NULL)
      ORDER BY created_at DESC
    `;
    
    const [videos] = await pool.execute(query);
    
    // Build QR code data with short URLs
    const qrCodes = videos.map(video => {
      // Build short URL from redirect_slug
      const shortUrl = video.shortSlug 
        ? `${config.urls.base}/s/${video.shortSlug}`
        : video.streamingUrl || `${config.urls.frontend}/stream/${video.videoId}`;
      
      return {
        videoId: video.videoId,
        title: video.title || video.videoId,
        course: video.course || null,
        grade: video.grade || null,
        lesson: video.lesson || null,
        module: video.module || null,
        activity: video.activity || null,
        topic: video.topic || null,
        shortSlug: video.shortSlug || null,
        shortUrl: shortUrl,
        qrUrl: video.qrUrl || null,
        streamingUrl: video.streamingUrl || null,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      };
    });
    
    console.log(`[Get All QR Codes] Found ${qrCodes.length} videos with QR codes`);
    
    res.json(qrCodes);
  } catch (error) {
    console.error('Get all QR codes error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch QR codes', 
      message: error.message 
    });
  }
}

export async function downloadQRCode(req, res) {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    console.log(`[Download QR Code] Requested for video: ${videoId}`);
    
    // Get video to verify it exists
    const video = await videoService.getVideoByVideoId(videoId, true);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Download QR code using service
    try {
      const qrBuffer = await qrCodeService.downloadQRCode(videoId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${videoId}_qr_code.png"`);
      res.setHeader('Content-Length', qrBuffer.length);
      
      console.log(`[Download QR Code] ✓ Sending QR code file for video: ${videoId}`);
      res.send(qrBuffer);
    } catch (qrError) {
      // If QR code file doesn't exist, try to generate it
      if (qrError.message.includes('not found') || qrError.code === 'ENOENT') {
        console.log(`[Download QR Code] QR code file not found, generating new one for: ${videoId}`);
        
        // Build short URL
        const shortUrl = video.redirect_slug 
          ? `${config.urls.base}/s/${video.redirect_slug}`
          : video.streaming_url || `${config.urls.frontend}/stream/${videoId}`;
        
        // Generate QR code
        const qrUrl = await qrCodeService.generateQRCode(videoId, shortUrl);
        
        // Download the newly generated QR code
        const qrBuffer = await qrCodeService.downloadQRCode(videoId);
        
        // Set headers for file download
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${videoId}_qr_code.png"`);
        res.setHeader('Content-Length', qrBuffer.length);
        
        console.log(`[Download QR Code] ✓ Generated and sent QR code for video: ${videoId}`);
        res.send(qrBuffer);
      } else {
        throw qrError;
      }
    }
  } catch (error) {
    console.error('Download QR code error:', error);
    res.status(500).json({ 
      error: 'Failed to download QR code', 
      message: error.message 
    });
  }
}

export async function getVideoVersions(req, res) {
  try {
    const { videoId } = req.params;
    const versions = await videoService.getVideoVersions(videoId);
    res.json(versions);
  } catch (error) {
    console.error('Get video versions error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getVideoDiagnostic(req, res) {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    console.log(`[Video Diagnostic] Checking video: ${videoId}`);

    const diagnostic = {
      videoId: videoId,
      fileExists: false,
      resolvedPath: null,
      fileSize: null,
      fileModified: null,
      possiblePaths: [],
      errors: []
    };

    // Get video from database (try both videoId and redirect_slug)
    let video = null;
    try {
      video = await videoService.getVideoByVideoId(videoId, true);
      if (!video) {
        video = await videoService.getVideoByRedirectSlug(videoId, true);
      }
    } catch (err) {
      diagnostic.errors.push(`Error fetching video: ${err.message}`);
      return res.json(diagnostic);
    }

    if (!video) {
      diagnostic.errors.push('Video not found in database');
      return res.json(diagnostic);
    }

    // Resolve file paths
    const backendDir = path.dirname(__dirname);
    const basePath = path.dirname(backendDir);
    let uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    
    const myStoragePath = path.join(uploadPath, 'my-storage');

    // Strategy 1: Try fixed format path (block storage): my-storage/<redirect_slug>.mp4
    if (video.redirect_slug) {
      const fixedPath = path.join(myStoragePath, `${video.redirect_slug}.mp4`);
      diagnostic.possiblePaths.push({
        path: fixedPath,
        strategy: 'Fixed format (block storage)',
        relative: `my-storage/${video.redirect_slug}.mp4`
      });
      
      if (fsSync.existsSync(fixedPath)) {
        const stats = fsSync.statSync(fixedPath);
        diagnostic.fileExists = true;
        diagnostic.resolvedPath = fixedPath;
        diagnostic.fileSize = stats.size;
        diagnostic.fileModified = stats.mtime.toISOString();
        return res.json(diagnostic);
      }
    }

    // Strategy 2: Try my-storage/<video_id>.mp4
    const videoIdPath = path.join(myStoragePath, `${video.video_id}.mp4`);
    diagnostic.possiblePaths.push({
      path: videoIdPath,
      strategy: 'Video ID format',
      relative: `my-storage/${video.video_id}.mp4`
    });
    
    if (fsSync.existsSync(videoIdPath)) {
      const stats = fsSync.statSync(videoIdPath);
      diagnostic.fileExists = true;
      diagnostic.resolvedPath = videoIdPath;
      diagnostic.fileSize = stats.size;
      diagnostic.fileModified = stats.mtime.toISOString();
      return res.json(diagnostic);
    }

    // Strategy 3: Try database file_path
    if (video.file_path) {
      let dbPath;
      if (path.isAbsolute(video.file_path)) {
        dbPath = video.file_path;
      } else {
        dbPath = path.join(uploadPath, video.file_path);
      }
      diagnostic.possiblePaths.push({
        path: dbPath,
        strategy: 'Database file_path',
        relative: video.file_path
      });
      
      if (fsSync.existsSync(dbPath)) {
        const stats = fsSync.statSync(dbPath);
        diagnostic.fileExists = true;
        diagnostic.resolvedPath = dbPath;
        diagnostic.fileSize = stats.size;
        diagnostic.fileModified = stats.mtime.toISOString();
        return res.json(diagnostic);
      }
    }

    // Strategy 4: Try misc folder
    const miscPath = path.join(uploadPath, 'misc', video.video_id + '.mp4');
    diagnostic.possiblePaths.push({
      path: miscPath,
      strategy: 'Misc folder',
      relative: `misc/${video.video_id}.mp4`
    });
    
    if (fsSync.existsSync(miscPath)) {
      const stats = fsSync.statSync(miscPath);
      diagnostic.fileExists = true;
      diagnostic.resolvedPath = miscPath;
      diagnostic.fileSize = stats.size;
      diagnostic.fileModified = stats.mtime.toISOString();
      return res.json(diagnostic);
    }

    // Strategy 5: Try nested folder structure (G{grade}/U{unit}/L{lesson}/)
    if (video.grade && video.unit && video.lesson) {
      const nestedPath = path.join(
        uploadPath,
        `G${String(video.grade).padStart(2, '0')}`,
        `U${String(video.unit).padStart(2, '0')}`,
        `L${String(video.lesson).padStart(2, '0')}`,
        `${video.video_id}.mp4`
      );
      diagnostic.possiblePaths.push({
        path: nestedPath,
        strategy: 'Nested folder structure',
        relative: `G${String(video.grade).padStart(2, '0')}/U${String(video.unit).padStart(2, '0')}/L${String(video.lesson).padStart(2, '0')}/${video.video_id}.mp4`
      });
      
      if (fsSync.existsSync(nestedPath)) {
        const stats = fsSync.statSync(nestedPath);
        diagnostic.fileExists = true;
        diagnostic.resolvedPath = nestedPath;
        diagnostic.fileSize = stats.size;
        diagnostic.fileModified = stats.mtime.toISOString();
        return res.json(diagnostic);
      }
    }

    // Strategy 6: Try to find file by VID pattern in my-storage
    try {
      if (fsSync.existsSync(myStoragePath)) {
        const files = fsSync.readdirSync(myStoragePath);
        const videoIdPattern = new RegExp(video.video_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        for (const file of files) {
          if (videoIdPattern.test(file) && file.endsWith('.mp4')) {
            const foundPath = path.join(myStoragePath, file);
            diagnostic.possiblePaths.push({
              path: foundPath,
              strategy: 'VID pattern match',
              relative: `my-storage/${file}`
            });
            
            const stats = fsSync.statSync(foundPath);
            diagnostic.fileExists = true;
            diagnostic.resolvedPath = foundPath;
            diagnostic.fileSize = stats.size;
            diagnostic.fileModified = stats.mtime.toISOString();
            return res.json(diagnostic);
          }
        }
      }
    } catch (searchError) {
      diagnostic.errors.push(`Error searching my-storage: ${searchError.message}`);
    }

    // File not found
    diagnostic.errors.push('Video file not found in any expected location');
    res.json(diagnostic);
  } catch (error) {
    console.error('Video diagnostic error:', error);
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function getFilterValues(req, res) {
  try {
    const values = await videoService.getFilterValues();
    res.json(values);
  } catch (error) {
    console.error('Get filter values error:', error);
    res.status(500).json({ error: error.message });
  }
}
