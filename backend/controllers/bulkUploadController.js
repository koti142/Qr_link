import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';
import { generateVideoId, generateVideoPath } from '../utils/videoIdGenerator.js';
import { ensureDirectoryExists, getFileSize } from '../utils/fileUtils.js';
import * as videoService from '../services/videoService.js';
import * as redirectService from '../services/redirectService.js';
import * as qrCodeService from '../services/qrCodeService.js';
import * as thumbnailService from '../services/thumbnailService.js';
import pool from '../config/database.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get list of videos from misc folder
 */
export async function getMiscVideos(req, res) {
  console.log('[getMiscVideos] Request received');
  console.log('[getMiscVideos] User:', req.user);
  try {
    // Resolve upload path properly (handle both absolute and relative paths)
    const basePath = path.dirname(__dirname);
    const uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    
    const miscPath = path.join(uploadPath, 'misc');
    
    console.log('Misc videos path resolution:', {
      basePath,
      configUploadPath: config.upload.uploadPath,
      resolvedUploadPath: uploadPath,
      resolvedMiscPath: miscPath,
      miscPathExists: fsSync.existsSync(miscPath)
    });
    
    // Check if misc folder exists
    if (!fsSync.existsSync(miscPath)) {
      console.warn(`Misc folder not found at: ${miscPath}`);
      return res.json({ 
        videos: [],
        message: `Misc folder not found at: ${miscPath}`,
        debug: {
          basePath,
          configUploadPath: config.upload.uploadPath,
          resolvedUploadPath: uploadPath,
          resolvedMiscPath: miscPath
        }
      });
    }

    // Read directory
    const files = await fs.readdir(miscPath);
    
    // Filter video files
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    const videos = [];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (videoExtensions.includes(ext)) {
        const filePath = path.join(miscPath, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          // Use absolute path for CSV - this is important for file path in CSV
          const absolutePath = path.resolve(filePath);
          // Also provide relative path for reference
          const relativePath = `misc/${file}`;
          
          videos.push({
            filename: file,
            path: absolutePath, // Absolute path for CSV
            relativePath: relativePath, // Relative path for reference
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            modified: stats.mtime
          });
        } catch (statError) {
          console.warn(`Failed to get stats for ${file}:`, statError.message);
          // Skip files that can't be accessed
        }
      }
    }

    // Sort by filename
    videos.sort((a, b) => a.filename.localeCompare(b.filename));

    console.log(`Found ${videos.length} video(s) in misc folder`);
    
    // Return videos with debug info in development
    const response = { videos };
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        basePath,
        configUploadPath: config.upload.uploadPath,
        resolvedUploadPath: uploadPath,
        resolvedMiscPath: miscPath,
        miscPathExists: fsSync.existsSync(miscPath)
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Get misc videos error:', error);
    console.error('Error stack:', error.stack);
    
    // Return detailed error with path info
    const basePath = path.dirname(__dirname);
    const uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    const miscPath = path.join(uploadPath, 'misc');
    
    res.status(500).json({ 
      error: 'Failed to fetch videos from misc folder',
      details: error.message,
      debug: {
        basePath,
        configUploadPath: config.upload.uploadPath,
        resolvedUploadPath: uploadPath,
        resolvedMiscPath: miscPath,
        miscPathExists: fsSync.existsSync(miscPath)
      },
      hint: 'Check server logs for path resolution details'
    });
  }
}

/**
 * Generate unique PartnerID
 */
function generatePartnerID(index = 0) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PARTNER_${timestamp}_${random}_${String(index + 1).padStart(3, '0')}`;
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Bulk upload videos from CSV file
 * CSV format should have columns:
 * PartnerID, Course, Grade, Lesson, Module, Activity, Topic, Title, Description, Language, Video File, Custom Thumbnail
 */
export async function bulkUploadFromCSV(req, res) {
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  let uploadHistoryId = null;
  const uploadedBy = req.user?.username || req.user?.id || 'unknown';

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    // Create upload history record (only if table exists)
    try {
      const [historyResult] = await pool.execute(
        `INSERT INTO csv_upload_history 
         (file_name, file_size, status, uploaded_by) 
         VALUES (?, ?, 'processing', ?)`,
        [req.file.originalname, req.file.size, uploadedBy]
      );
      uploadHistoryId = historyResult.insertId;
    } catch (historyError) {
      if (historyError.code === 'ER_NO_SUCH_TABLE') {
        console.warn('csv_upload_history table does not exist. Skipping history tracking.');
        console.warn('Run migration: npm run migrate-csv-history');
      } else {
        console.warn('Failed to create upload history record:', historyError.message);
      }
      // Continue with upload even if history tracking fails
    }

    // Read and parse CSV file
    let csvContent;
    try {
      csvContent = await fs.readFile(req.file.path, 'utf-8');
    } catch (readError) {
      throw new Error(`Failed to read CSV file: ${readError.message}`);
    }
    
    // Parse CSV (using sync parse from csv-parse)
    let records;
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        skip_records_with_error: false
      });
      
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('CSV file is empty or has no valid rows. Please check the CSV format.');
      }
      
      // Log CSV structure for debugging
      console.log(`CSV parsed successfully. Found ${records.length} rows.`);
      if (records.length > 0) {
        const columns = Object.keys(records[0]);
        console.log('CSV columns found:', columns);
        console.log('CSV column count:', columns.length);
        
        // Check for required columns
        const requiredColumns = ['Video File', 'PartnerID', 'Name'];
        const missingColumns = requiredColumns.filter(col => 
          !columns.some(c => c.toLowerCase() === col.toLowerCase())
        );
        
        if (missingColumns.length > 0) {
          console.warn('⚠ Missing required columns:', missingColumns);
          console.warn('Available columns:', columns);
        }
        
        // Log first row sample with all data
        console.log('First row sample:', Object.keys(records[0]).reduce((acc, key) => {
          const value = records[0][key];
          acc[key] = value ? String(value).substring(0, 100) : '';
          return acc;
        }, {}));
        
        // Specifically check for Video File column
        const videoFileColumn = columns.find(c => 
          c.toLowerCase().includes('video') && c.toLowerCase().includes('file')
        );
        if (videoFileColumn) {
          console.log(`✓ Found Video File column: "${videoFileColumn}"`);
          console.log(`  First value: ${records[0][videoFileColumn]?.substring(0, 100) || 'EMPTY'}`);
        } else {
          console.error('✗ Video File column not found!');
          console.error('  Looking for columns containing "video" and "file"');
          console.error('  Available columns:', columns);
        }
      }
    } catch (parseError) {
      console.error('CSV parsing error:', parseError);
      console.error('CSV content preview (first 500 chars):', csvContent.substring(0, 500));
      throw new Error(`Failed to parse CSV file: ${parseError.message}. Please ensure the CSV is properly formatted with headers.`);
    }

    results.total = records.length;

    console.log(`Processing ${results.total} videos from CSV...`);

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      // Skip completely empty rows
      const rowKeys = Object.keys(row);
      const hasData = rowKeys.some(key => row[key] && String(row[key]).trim() !== '');
      if (!hasData) {
        console.log(`[Row ${rowNumber}] Skipping empty row`);
        continue;
      }

      try {
        console.log(`[Row ${rowNumber}] Processing row with columns:`, rowKeys);
        // SIMPLIFIED CSV FORMAT: Name, Video File, Thumbnail (optional)
        // Extract data from CSV row - support simplified format with defaults
        let title, videoFilePath, thumbnailFilePath;
        
        // Initialize defaults
        title = '';
        videoFilePath = '';
        thumbnailFilePath = '';
        
        // Get Name (required)
        title = row.Name || row.name || row.Title || row.title || '';
        
        // Get Video File (required) - check multiple possible column names
        videoFilePath = row['Video File'] || 
                       row['VideoFile'] || 
                       row['video_file'] || 
                       row['video file'] ||
                       row['Video File '] || 
                       row['Video File*'] ||
                       row.videoFile || 
                       row.URL || 
                       row.url || 
                       row['Cloudflare URL'] || 
                       row['cloudflare_url'] || 
                       row['CloudflareURL'] ||
                       row['cloudflare url'] ||
                       row['Video'] || 
                       row['video'] || 
                       '';
        
        // Also check all row keys for case-insensitive match
        if (!videoFilePath || videoFilePath.trim() === '') {
          const rowKeys = Object.keys(row);
          const videoFileKey = rowKeys.find(key => {
            const normalized = key.toLowerCase().replace(/\s+/g, '');
            return normalized === 'videofile' ||
                   (normalized.includes('video') && normalized.includes('file')) ||
                   normalized === 'url' ||
                   normalized === 'cloudflareurl';
          });
          if (videoFileKey) {
            videoFilePath = row[videoFileKey] || '';
            console.log(`[Row ${rowNumber}] Found Video File in column: "${videoFileKey}"`);
          }
        }
        
        // Get Thumbnail (optional)
        thumbnailFilePath = row.Thumbnail || row.thumbnail || row['Custom Thumbnail'] || row['custom_thumbnail'] || '';
        
        // Set defaults for optional fields
        const partnerId = null; // Not required in simplified format
        const course = 'General'; // Default course
        const grade = 'All'; // Default grade
        const lesson = '1'; // Default lesson
        const module = '1'; // Default module
        const activity = '1'; // Default activity
        const topic = title || 'Video'; // Use title as topic
        const description = title ? `Video: ${title}` : 'Video Resource'; // Auto-generated description
        const language = 'en'; // Default language

        // Validate required fields
        if (!videoFilePath || videoFilePath.trim() === '') {
          // Check if we can construct from other fields
          console.error(`[Row ${rowNumber}] ✗ No Video File path/URL found in CSV.`);
          console.error(`[Row ${rowNumber}] Available columns:`, Object.keys(row));
          console.error(`[Row ${rowNumber}] Row data:`, JSON.stringify(row, null, 2));
          
          // Try to find any URL-like column
          const rowKeys = Object.keys(row);
          const urlLikeColumn = rowKeys.find(key => {
            const value = row[key];
            return value && typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
          });
          
          if (urlLikeColumn) {
            console.log(`[Row ${rowNumber}] Found URL-like value in column "${urlLikeColumn}": ${row[urlLikeColumn]}`);
            videoFilePath = row[urlLikeColumn];
          } else {
            throw new Error(`Video File path or URL is required. Available columns: ${rowKeys.join(', ')}. Please ensure the CSV contains a "Video File" column (or similar) with Cloudflare URLs or file paths.`);
          }
        }
        
        // Validate that we have at least a title or name
        if (!title || title.trim() === '') {
          console.warn(`[Row ${rowNumber}] No title/name found, using default`);
          title = 'Untitled Video';
        }
        
        // Log extracted data for debugging
        console.log(`[Row ${rowNumber}] Extracted data:`, {
          partnerId: partnerId || 'N/A',
          title: title || 'N/A',
          videoFilePath: videoFilePath.substring(0, 100) + (videoFilePath.length > 100 ? '...' : ''),
          thumbnailFilePath: thumbnailFilePath || 'N/A',
          course: course || 'N/A',
          grade: grade || 'N/A'
        });

        // Clean the video file path
        videoFilePath = videoFilePath.trim();
        
        console.log(`[Row ${rowNumber}] Processing video file: ${videoFilePath.substring(0, 100)}...`);

        // Check if it's a Cloudflare URL or local file path
        const isCloudflareUrl = videoFilePath && (videoFilePath.startsWith('http://') || videoFilePath.startsWith('https://'));
        let fullVideoPath;
        let isRemoteFile = false;

        if (isCloudflareUrl) {
          // It's a Cloudflare URL - validate and use it directly
          try {
            // Validate URL format
            const urlObj = new URL(videoFilePath);
            console.log(`[Row ${rowNumber}] Validated URL: ${urlObj.href}`);
            
            // Check if it's a mock/test URL
            const isMockUrl = videoFilePath.includes('your-account.r2.cloudflarestorage.com') ||
                            videoFilePath.includes('r2.cloudflarestorage.com') ||
                            videoFilePath.includes('mock-cloudflare.example.com') ||
                            (videoFilePath.includes('example.com') && !videoFilePath.includes('pub-')) ||
                            videoFilePath.includes('test.cloudflare');
            
            if (isMockUrl) {
              console.warn(`[Row ${rowNumber}] ⚠ WARNING: Detected mock Cloudflare URL: ${videoFilePath}`);
              console.warn(`[Row ${rowNumber}] ⚠ This URL will be treated as a mock URL and may not be accessible.`);
              // Continue with mock URL - system will handle fallback to local files
            } else {
              console.log(`[Row ${rowNumber}] ✓ Valid Cloudflare URL detected: ${videoFilePath.substring(0, 80)}...`);
            }
            
            fullVideoPath = videoFilePath;
            isRemoteFile = true;
            console.log(`[Row ${rowNumber}] Detected Cloudflare URL: ${fullVideoPath}`);
            
            // Optional: Check if URL exists in cloudflare_resources table
            try {
              const [cloudflareResources] = await pool.execute(
                'SELECT * FROM cloudflare_resources WHERE cloudflare_url = ? LIMIT 1',
                [fullVideoPath]
              );
              if (cloudflareResources.length > 0) {
                console.log(`[Row ${rowNumber}] Found Cloudflare resource in database: ${cloudflareResources[0].file_name}`);
              } else {
                console.log(`[Row ${rowNumber}] Cloudflare URL not found in database, but proceeding with import`);
              }
            } catch (dbError) {
              console.warn(`[Row ${rowNumber}] Could not check Cloudflare resources table:`, dbError.message);
              // Continue anyway - URL might be valid even if not in our database
            }
          } catch (urlError) {
            throw new Error(`Invalid URL format: ${videoFilePath}`);
          }
        } else {
          // It's a local file path - check if it exists
          if (path.isAbsolute(videoFilePath)) {
            fullVideoPath = videoFilePath;
          } else {
            // Try relative to project root, then relative to upload path
            const projectRoot = path.join(__dirname, '../..');
            fullVideoPath = path.resolve(projectRoot, videoFilePath);
            
            // If not found, try relative to upload path
            if (!fsSync.existsSync(fullVideoPath)) {
              fullVideoPath = path.resolve(config.upload.uploadPath, videoFilePath);
            }
          }

          if (!fsSync.existsSync(fullVideoPath)) {
            throw new Error(`Video file not found: ${videoFilePath}`);
          }
        }

        // Check file extension (for both local files and URLs)
        let ext;
        if (isRemoteFile) {
          // For URLs, extract extension from URL
          try {
            const urlPath = new URL(fullVideoPath).pathname;
            ext = path.extname(urlPath).toLowerCase();
          } catch {
            // If URL parsing fails, try to extract from pathname directly
            ext = path.extname(fullVideoPath).toLowerCase();
          }
        } else {
          ext = path.extname(fullVideoPath).toLowerCase();
        }
        
        if (ext && !['.mp4', '.webm', '.mov', '.avi', '.m3u8'].includes(ext)) {
          throw new Error(`Invalid video file type: ${ext}. Only MP4, WebM, MOV, AVI, and M3U8 are allowed.`);
        }

        // Prepare video data
        const videoData = {
          course,
          grade,
          lesson,
          module,
          activity,
          topic,
          title,
          description,
          language
        };

        // Generate video ID - ensure uniqueness for CSV uploads
        // For CSV uploads, we need unique IDs even if metadata is the same
        let baseVideoId = generateVideoId(videoData);
        
        // Strategy: Always add unique identifier to prevent duplicates
        // Use title if available and unique, otherwise use video file hash
        let uniqueIdentifier = '';
        
        if (title && title.trim() !== '' && title !== 'Untitled Video') {
          // Use cleaned title as unique identifier (max 20 chars)
          const cleanTitle = title.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
          if (cleanTitle && cleanTitle.length > 3) {
            uniqueIdentifier = cleanTitle;
          }
        }
        
        // If no good title, use hash of video file URL/path
        if (!uniqueIdentifier && videoFilePath) {
          const fileHash = crypto.createHash('md5')
            .update(videoFilePath)
            .digest('hex')
            .substring(0, 8); // Use first 8 chars of hash
          uniqueIdentifier = fileHash;
        }
        
        // Final fallback: use row number + short timestamp
        if (!uniqueIdentifier) {
          uniqueIdentifier = `${rowNumber}_${Date.now().toString(36).slice(-4)}`;
        }
        
        // Combine base ID with unique identifier
        // If base ID is generic, replace it with unique identifier
        let videoId;
        if (baseVideoId === 'General_All_1_1_1' || baseVideoId.startsWith('General_All_')) {
          // Use unique identifier as the main ID component
          videoId = `CSV_${uniqueIdentifier}`;
        } else {
          // Append unique identifier to base ID
          videoId = `${baseVideoId}_${uniqueIdentifier}`;
        }
        
        console.log(`[Row ${rowNumber}] Generated unique video ID: ${videoId} (base: ${baseVideoId}, unique: ${uniqueIdentifier})`);
        
        // Get latest version (needed for both local and remote files)
        const latestVersion = await videoService.getLatestVersion(videoId).catch(() => 1);

        let streamingUrl;
        let relativePath;
        let size = 0;
        let targetFilePath = null;

        if (isRemoteFile) {
          // For Cloudflare URLs, use the URL directly as streaming URL
          streamingUrl = fullVideoPath;
          relativePath = fullVideoPath;
          
          // Check if this video resource already exists (duplicate detection)
          const existingVideo = await videoService.findVideoByFileOrUrl(null, streamingUrl);
          if (existingVideo) {
            console.log(`[Row ${rowNumber}] ⚠ Duplicate video detected! Video with URL "${streamingUrl}" already exists (ID: ${existingVideo.video_id}). Skipping duplicate upload.`);
            results.failed++;
            results.errors.push({
              row: rowNumber,
              video: title || videoFilePath || 'Unknown',
              message: `Video already exists: ${existingVideo.title || existingVideo.video_id} (same resource URL)`,
              errorType: 'DuplicateResource',
              errorCode: 'DUPLICATE_RESOURCE'
            });
            continue; // Skip to next row
          }
          
          // Try to get file size from cloudflare_resources table if available
          try {
            const [resources] = await pool.execute(
              'SELECT file_size FROM cloudflare_resources WHERE cloudflare_url = ? LIMIT 1',
              [fullVideoPath]
            );
            if (resources.length > 0 && resources[0].file_size) {
              size = resources[0].file_size;
              console.log(`[Row ${rowNumber}] Found file size from Cloudflare resource: ${size} bytes`);
            } else {
              size = 0;
              console.log(`[Row ${rowNumber}] File size not available, using 0`);
            }
          } catch (dbError) {
            console.warn(`[Row ${rowNumber}] Could not get file size from database:`, dbError.message);
            size = 0;
          }
          
          console.log(`[Row ${rowNumber}] ✓ Using Cloudflare URL directly: ${streamingUrl}`);
        } else {
          // For local files, check for duplicates BEFORE copying
          // First, check if the source file path already exists in database
          const sourceFileCheck = await videoService.findVideoByFileOrUrl(fullVideoPath, null);
          if (sourceFileCheck) {
            console.log(`[Row ${rowNumber}] ⚠ Duplicate video detected! Video with source file "${fullVideoPath}" already exists (ID: ${sourceFileCheck.video_id}). Skipping duplicate upload.`);
            results.failed++;
            results.errors.push({
              row: rowNumber,
              video: title || videoFilePath || 'Unknown',
              message: `Video already exists: ${sourceFileCheck.title || sourceFileCheck.video_id} (same source file)`,
              errorType: 'DuplicateResource',
              errorCode: 'DUPLICATE_RESOURCE'
            });
            continue; // Skip to next row
          }
          
          // For local files, copy to target location
          const folderPath = generateVideoPath(videoData);
          const targetFolder = path.join(config.upload.uploadPath, folderPath);
          
          await ensureDirectoryExists(targetFolder);
          
          // Generate filename with version
          const versionStr = latestVersion > 1 ? `_v${String(latestVersion).padStart(2, '0')}` : '';
          const originalFileName = path.basename(fullVideoPath);
          const fileExtension = path.extname(originalFileName);
          const newFileName = `${videoId}${versionStr}_master${fileExtension}`;
          targetFilePath = path.join(targetFolder, newFileName);

          // Check if target file path already exists (duplicate detection)
          relativePath = path.join(folderPath, newFileName).replace(/\\/g, '/');
          // Use temporary streaming URL for duplicate check (will be updated with redirect slug later)
          const tempStreamingUrl = videoService.buildStreamingUrl(relativePath, videoId);
          
          const existingVideo = await videoService.findVideoByFileOrUrl(relativePath, tempStreamingUrl);
          if (existingVideo) {
            console.log(`[Row ${rowNumber}] ⚠ Duplicate video detected! Video with path "${relativePath}" already exists (ID: ${existingVideo.video_id}). Skipping duplicate upload.`);
            results.failed++;
            results.errors.push({
              row: rowNumber,
              video: title || videoFilePath || 'Unknown',
              message: `Video already exists: ${existingVideo.title || existingVideo.video_id} (same file resource)`,
              errorType: 'DuplicateResource',
              errorCode: 'DUPLICATE_RESOURCE'
            });
            continue; // Skip to next row - don't copy the file
          }

          // Copy video file to target location (only if not duplicate)
          await fs.copyFile(fullVideoPath, targetFilePath);
          console.log(`✓ Copied video file: ${targetFilePath}`);

          // Get file size
          size = await getFileSize(targetFilePath);
        }

        // CRITICAL: redirect_slug is REQUIRED and UNIQUE in database
        // Use videoId as fallback if redirect creation fails
        const redirectSlug = videoId;
        // Redirect to stream page so users can directly watch the video
        const redirectUrl = `${config.urls.frontend}/stream/${videoId}`;

        // Create redirect with short URL - handle duplicates gracefully
        let redirectResult;
        let shortUrl = redirectUrl;
        let shortSlug = redirectSlug; // Always use videoId as fallback to ensure we have a value
        try {
          redirectResult = await redirectService.createRedirect(redirectSlug, redirectUrl, true);
          shortUrl = redirectResult.shortUrl || redirectUrl;
          shortSlug = redirectResult.shortSlug || redirectSlug; // Use generated slug or fallback to videoId
          console.log(`[Row ${rowNumber}] ✓ Created redirect with slug: ${shortSlug}`);
        } catch (redirectError) {
          // If redirect slug already exists, generate a unique one
          if (redirectError.code === 'ER_DUP_ENTRY' || redirectError.message.includes('Duplicate entry')) {
            console.warn(`[Row ${rowNumber}] Redirect slug ${redirectSlug} already exists, generating unique slug...`);
            try {
              const uniqueSlug = `${redirectSlug}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              redirectResult = await redirectService.createRedirect(uniqueSlug, redirectUrl, true);
              shortUrl = redirectResult.shortUrl || redirectUrl;
              shortSlug = redirectResult.shortSlug || uniqueSlug;
              console.log(`[Row ${rowNumber}] ✓ Created redirect with unique slug: ${shortSlug}`);
            } catch (retryError) {
              console.warn(`[Row ${rowNumber}] Failed to create redirect with unique slug, using videoId:`, retryError.message);
              shortSlug = redirectSlug; // videoId
              shortUrl = redirectUrl;
            }
          } else {
            console.warn(`[Row ${rowNumber}] Failed to create redirect, using videoId as slug:`, redirectError.message);
            // Use videoId as redirect slug - this ensures we always have a value
            shortSlug = redirectSlug; // videoId
            shortUrl = redirectUrl;
          }
        }
        
        // Ensure shortSlug is never null or empty (required field)
        if (!shortSlug || shortSlug.trim() === '') {
          console.error(`[Row ${rowNumber}] CRITICAL: redirect_slug is empty! Using videoId as fallback.`);
          shortSlug = videoId;
        }

        // Build streaming URL using localhost with redirect slug (for short URLs like /s/:slug)
        // This ensures videos are always streamed from localhost instead of Cloudflare URLs
        if (!isRemoteFile) {
          // For local files, use the redirect slug for streaming URL
          streamingUrl = videoService.buildStreamingUrl(relativePath, videoId, shortSlug);
        } else {
          // For remote files (Cloudflare URLs), still use localhost streaming endpoint
          // This ensures consistent localhost URLs for all videos
          streamingUrl = videoService.buildStreamingUrl(null, videoId, shortSlug);
        }

        // Generate QR code with short URL
        let qrUrl = null;
        try {
          qrUrl = await qrCodeService.generateQRCode(videoId, shortUrl);
        } catch (qrError) {
          console.warn(`[Row ${rowNumber}] Failed to generate QR code:`, qrError.message);
          // Continue without QR code
        }

        // Handle thumbnail
        let thumbnailUrl = null;
        try {
          if (thumbnailFilePath && thumbnailFilePath.trim() !== '') {
            // Check if it's a URL
            if (thumbnailFilePath.startsWith('http://') || thumbnailFilePath.startsWith('https://')) {
              // It's a URL - use it directly
              thumbnailUrl = thumbnailFilePath;
              console.log(`[Row ${rowNumber}] ✓ Using thumbnail URL: ${thumbnailUrl}`);
            } else if (thumbnailFilePath.startsWith('/')) {
              // It's a relative path from thumbnails folder (e.g., /thumbnails/filename.png)
              thumbnailUrl = thumbnailFilePath;
              console.log(`[Row ${rowNumber}] ✓ Using thumbnail path: ${thumbnailUrl}`);
            } else if (thumbnailFilePath.toLowerCase().startsWith('thumbnails/')) {
              // It's a path like thumbnails/filename.png (no leading slash)
              thumbnailUrl = `/${thumbnailFilePath}`;
              console.log(`[Row ${rowNumber}] ✓ Using thumbnail path (normalized): ${thumbnailUrl}`);
            } else {
              // Try to normalize - if it's just a filename, add thumbnails/ prefix
              if (!thumbnailFilePath.includes('/')) {
                thumbnailUrl = `/thumbnails/${thumbnailFilePath}`;
                console.log(`[Row ${rowNumber}] ✓ Normalized thumbnail filename to: ${thumbnailUrl}`);
              } else if (fsSync.existsSync(thumbnailFilePath)) {
                // Use custom thumbnail from local path
                const thumbnailExt = path.extname(thumbnailFilePath).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.webp'].includes(thumbnailExt)) {
                  const thumbnailBuffer = await fs.readFile(thumbnailFilePath);
                  const thumbnailFile = {
                    buffer: thumbnailBuffer,
                    originalname: path.basename(thumbnailFilePath),
                    mimetype: thumbnailExt === '.png' ? 'image/png' : 
                             thumbnailExt === '.webp' ? 'image/webp' : 'image/jpeg'
                  };
                  thumbnailUrl = await thumbnailService.saveUploadedThumbnail(thumbnailFile, videoId);
                  console.log(`[Row ${rowNumber}] ✓ Custom thumbnail saved: ${thumbnailUrl}`);
                }
              } else {
                // Try to construct path from thumbnails folder
                const thumbnailsDir = path.join(__dirname, '../../video-storage/thumbnails');
                const possiblePath = path.join(thumbnailsDir, thumbnailFilePath);
                if (fsSync.existsSync(possiblePath)) {
                  thumbnailUrl = `/thumbnails/${thumbnailFilePath}`;
                  console.log(`[Row ${rowNumber}] ✓ Found thumbnail at: ${thumbnailUrl}`);
                } else {
                  console.warn(`[Row ${rowNumber}] ⚠ Thumbnail file not found: ${thumbnailFilePath}`);
                }
              }
            }
          }
          
          // If no thumbnail yet and we have a local video file, generate from video
          if (!thumbnailUrl && targetFilePath && fsSync.existsSync(targetFilePath)) {
            try {
              thumbnailUrl = await thumbnailService.generateThumbnail(targetFilePath, videoId);
              console.log(`[Row ${rowNumber}] ✓ Thumbnail generated from video: ${thumbnailUrl}`);
            } catch (genError) {
              console.warn(`[Row ${rowNumber}] ⚠ Failed to generate thumbnail from video:`, genError.message);
            }
          }
          
          // ALWAYS set a default thumbnail if none was found/assigned
          // This ensures videos always have a thumbnail URL, even if it's just the default
          if (!thumbnailUrl) {
            thumbnailUrl = '/thumbnails/default.png';
            console.log(`[Row ${rowNumber}] ✓ Using default thumbnail: ${thumbnailUrl}`);
          }
        } catch (thumbnailError) {
          console.warn(`[Row ${rowNumber}] ⚠ Thumbnail processing failed:`, thumbnailError.message);
          console.warn(`[Row ${rowNumber}] ⚠ Thumbnail error stack:`, thumbnailError.stack);
          // Always set default thumbnail even on error
          thumbnailUrl = '/thumbnails/default.png';
          console.log(`[Row ${rowNumber}] ✓ Using default thumbnail after error: ${thumbnailUrl}`);
        }

        // Get video duration (placeholder - in production, use ffprobe)
        const duration = 0;

        // Create video entry in database
        const originalFileName = isRemoteFile ? (() => {
          try {
            return path.basename(new URL(fullVideoPath).pathname);
          } catch {
            return 'video';
          }
        })() : path.basename(fullVideoPath);
        // CRITICAL: Ensure all required fields are set (NOT NULL fields in database)
        // file_path and streaming_url are REQUIRED in database schema
        if (!relativePath || relativePath.trim() === '') {
          console.error(`[Row ${rowNumber}] CRITICAL: file_path is empty! Using streamingUrl as fallback.`);
          relativePath = streamingUrl || fullVideoPath || 'unknown';
        }
        
        if (!streamingUrl || streamingUrl.trim() === '') {
          console.error(`[Row ${rowNumber}] CRITICAL: streaming_url is empty! Using file_path as fallback.`);
          streamingUrl = relativePath || fullVideoPath || 'unknown';
        }
        
        // Ensure redirectSlug is never null (required and unique)
        if (!shortSlug || shortSlug.trim() === '') {
          console.error(`[Row ${rowNumber}] CRITICAL: redirect_slug is empty! Using videoId as fallback.`);
          shortSlug = videoId;
        }
        
        const dbVideoData = {
          videoId,
          partnerId: null,
          title: title || originalFileName || 'Untitled Video',
          course: course || null,
          grade: grade || null,
          lesson: lesson || null,
          module: module || null,
          activity: activity || null,
          topic: topic || null,
          description: description || '',
          language: language || 'en',
          filePath: relativePath, // REQUIRED - ensure it's never null
          streamingUrl: streamingUrl, // REQUIRED - ensure it's never null
          qrUrl: qrUrl || null,
          thumbnailUrl: thumbnailUrl || null,
          redirectSlug: shortSlug, // REQUIRED and UNIQUE - ensure it's never null
          duration: duration || 0,
          size: size || 0,
          version: latestVersion || 1,
          status: 'active'
        };

        let videoDbId;
        try {
          // Log data being inserted for debugging
          console.log(`[Row ${rowNumber}] Attempting to create video with data:`, {
            videoId,
            title: title || 'Untitled',
            course: course || 'N/A',
            grade: grade || 'N/A',
            streamingUrl: streamingUrl?.substring(0, 80) || 'N/A',
            thumbnailUrl: thumbnailUrl || 'N/A',
            redirectSlug: shortSlug || 'N/A',
            filePath: relativePath?.substring(0, 80) || 'N/A'
          });
          
          videoDbId = await videoService.createVideo(dbVideoData);
          console.log(`[Row ${rowNumber}] ✓ Video created in database with ID: ${videoDbId}`);
        } catch (createError) {
          // Check if it's a duplicate video error (video_id or redirect_slug)
          if (createError.code === 'ER_DUP_ENTRY' || 
              createError.message.includes('Duplicate entry') ||
              createError.message.includes('UNIQUE constraint')) {
            const isVideoIdDuplicate = createError.message.includes('video_id') || 
                                      createError.message.includes('PRIMARY');
            const isSlugDuplicate = createError.message.includes('redirect_slug') ||
                                   createError.message.includes('slug');
            
            if (isSlugDuplicate) {
              // Try to generate a new unique slug
              console.warn(`[Row ${rowNumber}] Redirect slug ${shortSlug} already exists, generating new one...`);
              try {
                const newSlug = `${videoId}_${Date.now()}`;
                dbVideoData.redirectSlug = newSlug;
                shortSlug = newSlug;
                videoDbId = await videoService.createVideo(dbVideoData);
                console.log(`[Row ${rowNumber}] ✓ Video created with new slug: ${newSlug}`);
              } catch (retryError) {
                console.error(`[Row ${rowNumber}] ✗ Failed to create video even with new slug:`, retryError.message);
                results.failed++;
                results.errors.push({
                  row: rowNumber,
                  video: title || videoFilePath || 'Unknown',
                  message: `Failed to create video: ${retryError.message}`
                });
                continue;
              }
            } else if (isVideoIdDuplicate) {
              console.warn(`[Row ${rowNumber}] Video with ID ${videoId} already exists, skipping...`);
              results.failed++;
              results.errors.push({
                row: rowNumber,
                video: title || videoFilePath || 'Unknown',
                message: `Video with ID ${videoId} already exists in database`
              });
              continue; // Skip to next row
            } else {
              // Generic duplicate error
              console.warn(`[Row ${rowNumber}] Duplicate entry detected:`, createError.message);
              results.failed++;
              results.errors.push({
                row: rowNumber,
                video: title || videoFilePath || 'Unknown',
                message: `Duplicate entry: ${createError.message}`
              });
              continue;
            }
          } else {
            // Log detailed error information
            console.error(`[Row ${rowNumber}] ✗ Database error creating video:`, createError.message);
            console.error(`[Row ${rowNumber}] ✗ Error code:`, createError.code);
            console.error(`[Row ${rowNumber}] ✗ Error SQL state:`, createError.sqlState);
            console.error(`[Row ${rowNumber}] ✗ Error SQL message:`, createError.sqlMessage);
            console.error(`[Row ${rowNumber}] ✗ Full error:`, createError);
            
            results.failed++;
            results.errors.push({
              row: rowNumber,
              video: title || videoFilePath || 'Unknown',
              message: `Database error: ${createError.message}`
            });
            continue; // Continue with next row instead of throwing
          }
        }
        
        // Create video version only for local files (not Cloudflare URLs)
        try {
          if (!isRemoteFile && targetFilePath) {
            await videoService.createVideoVersion(videoId, latestVersion, relativePath, size);
          } else if (isRemoteFile) {
            // For Cloudflare URLs, create a version entry with the URL
            await videoService.createVideoVersion(videoId, latestVersion, relativePath, size || 0);
          }
        } catch (versionError) {
          console.warn(`[Row ${rowNumber}] Failed to create video version:`, versionError.message);
          // Continue - version creation is not critical
        }

        results.successful++;
        console.log(`✓ Row ${rowNumber}: Video uploaded successfully - ${videoId}`);
        console.log(`  - Title: ${title || 'Untitled'}`);
        console.log(`  - Course: ${course || 'N/A'}, Grade: ${grade || 'N/A'}, Lesson: ${lesson || 'N/A'}`);
        console.log(`  - Module: ${module || 'N/A'}, Activity: ${activity || 'N/A'}`);
        console.log(`  - Streaming URL: ${streamingUrl.substring(0, 80)}${streamingUrl.length > 80 ? '...' : ''}`);
        console.log(`  - Database ID: ${videoDbId}`);

      } catch (error) {
        results.failed++;
        const errorMsg = {
          row: rowNumber,
          video: title || videoFilePath || partnerId || 'Unknown',
          message: error.message || 'Unknown error occurred',
          errorType: error.name || 'Error',
          errorCode: error.code || null
        };
        results.errors.push(errorMsg);
        console.error(`✗ Row ${rowNumber}: ${error.message}`);
        console.error(`✗ Error type: ${error.name || 'Unknown'}`);
        console.error(`✗ Error code: ${error.code || 'N/A'}`);
        console.error(`✗ Error details:`, error);
        if (error.stack) {
          console.error(`✗ Error stack:`, error.stack);
        }
        
        // Log row data for debugging
        console.error(`✗ Row data:`, {
          partnerId: partnerId || 'N/A',
          title: title || 'N/A',
          videoFilePath: videoFilePath || 'N/A',
          course: course || 'N/A',
          grade: grade || 'N/A'
        });
        
        // Continue processing other rows even if one fails
      }
    }

    // Update upload history with final status (only if history record exists)
    if (uploadHistoryId) {
      try {
        const finalStatus = results.failed === 0 ? 'completed' : (results.successful > 0 ? 'completed' : 'failed');
        const errorMessage = results.errors.length > 0 ? results.errors.map(e => `${e.row}: ${e.message}`).join('; ').substring(0, 1000) : null;
        
        await pool.execute(
          `UPDATE csv_upload_history 
           SET status = ?, 
               total_videos = ?, 
               successful_videos = ?, 
               failed_videos = ?,
               error_message = ?
           WHERE id = ?`,
          [finalStatus, results.total, results.successful, results.failed, errorMessage, uploadHistoryId]
        );
      } catch (updateError) {
        console.warn('Failed to update upload history:', updateError.message);
        // Don't fail the upload if history update fails
      }
    }

    // Clean up uploaded CSV file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup CSV file:', cleanupError.message);
    }

    res.json({
      message: 'Bulk upload completed',
      results,
      uploadHistoryId
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    // Update upload history with error status (only if history record exists)
    if (uploadHistoryId) {
      try {
        await pool.execute(
          `UPDATE csv_upload_history 
           SET status = 'failed', 
               error_message = ?
           WHERE id = ?`,
          [error.message.substring(0, 1000), uploadHistoryId]
        );
      } catch (updateError) {
        // Don't log as error if table doesn't exist
        if (updateError.code !== 'ER_NO_SUCH_TABLE') {
          console.error('Failed to update upload history:', updateError.message);
        }
      }
    }
    
    // Clean up uploaded CSV file
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    // Return detailed error information
    const errorResponse = {
      error: 'Bulk upload failed',
      message: error.message || 'Unknown error occurred',
      results,
      details: {
        totalProcessed: results.total,
        successful: results.successful,
        failed: results.failed,
        errorCount: results.errors.length
      },
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        name: error.name,
        code: error.code,
        firstErrors: results.errors.slice(0, 5) // Show first 5 errors
      })
    };

    console.error('=== BULK UPLOAD FAILED ===');
    console.error('Error:', error.message);
    console.error('Results:', results);
    console.error('First errors:', results.errors.slice(0, 3));

    res.status(500).json(errorResponse);
  }
}

/**
 * Get CSV upload history
 */
export async function getUploadHistory(req, res) {
  try {
    // Check if table exists, if not return empty array
    try {
      await pool.execute('SELECT 1 FROM csv_upload_history LIMIT 1');
    } catch (tableError) {
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        console.warn('csv_upload_history table does not exist. Returning empty history.');
        return res.json({
          history: [],
          total: 0,
          limit: 50,
          offset: 0,
          message: 'Upload history table not found. Run migration: npm run migrate-csv-history'
        });
      }
      throw tableError;
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // MySQL doesn't accept LIMIT/OFFSET as parameters in prepared statements, so embed them in the query
    const limitValue = Math.max(1, Math.min(limit, 100)); // Clamp between 1 and 100
    const offsetValue = Math.max(0, offset); // Ensure non-negative

    const [history] = await pool.execute(
      `SELECT 
        id, file_name, file_size, total_videos, successful_videos, failed_videos,
        status, error_message, uploaded_by, created_at, updated_at
       FROM csv_upload_history
       ORDER BY created_at DESC
       LIMIT ${limitValue} OFFSET ${offsetValue}`
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM csv_upload_history'
    );
    const total = countResult[0]?.total || 0;

    res.json({
      history,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch upload history', 
      message: error.message,
      code: error.code 
    });
  }
}
