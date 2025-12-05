import pool from '../config/database.js';
import { generateVideoId, generateVideoPath } from '../utils/videoIdGenerator.js';
import { getVideoFilePath, ensureDirectoryExists, getFileSize } from '../utils/fileUtils.js';
import { generateQRCode } from './qrCodeService.js';
import config from '../config/config.js';

/**
 * Create video entry in database
 */
export async function createVideo(videoData) {
  const {
    videoId,
    partnerId,
    title,
    course,
    grade,
    lesson,
    module,
    activity,
    topic,
    description,
    language,
    filePath,
    streamingUrl,
    qrUrl,
    thumbnailUrl,
    redirectSlug,
    duration,
    size,
    version = 1,
    status = 'active'
  } = videoData;
  
  // Try with all new columns first, fallback to old schema if columns don't exist
  let query, params;
  
  try {
    // Try with new schema (partner_id, course, module, activity, thumbnail_url)
    query = `
      INSERT INTO videos (
        video_id, partner_id, title, course, grade, lesson, module, activity, topic, description, language,
        file_path, streaming_url, qr_url, thumbnail_url, redirect_slug, duration, size, version, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    params = [
      videoId, 
      partnerId || null, 
      title || 'Untitled Video', 
      course || null, 
      grade || null, 
      lesson || null, 
      module || null, 
      activity || null, 
      topic || null, 
      description || '', 
      language || 'en',
      filePath || null, 
      streamingUrl || null, 
      qrUrl || null, 
      thumbnailUrl || null, 
      redirectSlug || null, 
      duration || 0, 
      size || 0, 
      version || 1, 
      status || 'active'
    ];
    
    const [result] = await pool.execute(query, params);
    return result.insertId;
  } catch (error) {
    // If new columns don't exist, try with old schema
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.warn('New columns not found, using old schema. Please run database migrations.');
      
      // Fallback to old schema (without course, module, activity, thumbnail_url)
      // Map course/grade/lesson to old grade/unit/lesson structure
      query = `
        INSERT INTO videos (
          video_id, title, grade, unit, lesson, topic, description, language,
          file_path, streaming_url, qr_url, redirect_slug, duration, size, version, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Try to extract numeric values from text fields
      const gradeNum = grade ? parseInt(grade.toString().replace(/\D/g, '')) || null : null;
      const unitNum = course ? parseInt(course.toString().replace(/\D/g, '')) || null : null;
      const lessonNum = lesson ? parseInt(lesson.toString().replace(/\D/g, '')) || null : null;
      
      params = [
        videoId, title || 'Untitled Video', gradeNum || 0, unitNum || 0, lessonNum || 0, topic || '', 
        description || '', language || 'en',
        filePath, streamingUrl, qrUrl, redirectSlug, duration || 0, size || 0, version, status
      ];
      
      const [result] = await pool.execute(query, params);
      return result.insertId;
    }
    throw error;
  }
  
  return result.insertId;
}

/**
 * Get video by ID
 * @param {string} videoId - The video_id to search for
 * @param {boolean} includeInactive - If true, also return inactive videos
 */
export async function getVideoByVideoId(videoId, includeInactive = false) {
  let query = 'SELECT * FROM videos WHERE video_id = ?';
  if (!includeInactive) {
    query += ' AND status = "active"';
  }
  query += ' ORDER BY version DESC LIMIT 1';
  const [rows] = await pool.execute(query, [videoId]);
  return rows[0] || null;
}

/**
 * Get video by database ID
 */
export async function getVideoById(id) {
  const query = 'SELECT * FROM videos WHERE id = ?';
  const [rows] = await pool.execute(query, [id]);
  return rows[0] || null;
}

/**
 * Check if a video with the same file path or streaming URL already exists
 * This prevents duplicate uploads of the same video resource
 */
export async function findVideoByFileOrUrl(filePath, streamingUrl) {
  try {
    // Check by streaming_url first (most reliable for Cloudflare URLs)
    if (streamingUrl && streamingUrl.trim() !== '') {
      const [urlRows] = await pool.execute(
        'SELECT * FROM videos WHERE streaming_url = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
        [streamingUrl]
      );
      if (urlRows.length > 0) {
        return urlRows[0];
      }
    }
    
    // Check by file_path (for local files)
    if (filePath && filePath.trim() !== '') {
      const [pathRows] = await pool.execute(
        'SELECT * FROM videos WHERE file_path = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
        [filePath]
      );
      if (pathRows.length > 0) {
        return pathRows[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for duplicate video:', error);
    return null;
  }
}

/**
 * Get video by redirect slug (short URL)
 */
export async function getVideoByRedirectSlug(redirectSlug, includeInactive = false) {
  let query = 'SELECT * FROM videos WHERE redirect_slug = ?';
  if (!includeInactive) {
    query += ' AND status = "active"';
  }
  query += ' ORDER BY version DESC LIMIT 1';
  const [rows] = await pool.execute(query, [redirectSlug]);
  return rows[0] || null;
}

/**
 * Get all videos with filters
 */
export async function getAllVideos(filters = {}) {
  let query = 'SELECT * FROM videos WHERE 1=1';
  const params = [];
  
  // Search filter - searches in title, description, video_id, course, grade, lesson, module, activity, topic
  if (filters.search) {
    query += ` AND (
      title LIKE ? OR 
      description LIKE ? OR 
      video_id LIKE ? OR 
      course LIKE ? OR 
      grade LIKE ? OR 
      lesson LIKE ? OR 
      module LIKE ? OR 
      activity LIKE ? OR 
      topic LIKE ?
    )`;
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  if (filters.course) {
    query += ' AND course = ?';
    params.push(filters.course);
  }
  
  if (filters.grade) {
    query += ' AND grade = ?';
    params.push(filters.grade);
  }
  
  if (filters.lesson) {
    query += ' AND lesson = ?';
    params.push(filters.lesson);
  }
  
  if (filters.module) {
    query += ' AND module = ?';
    params.push(filters.module);
  }
  
  if (filters.activity) {
    query += ' AND activity = ?';
    params.push(filters.activity);
  }
  
  if (filters.unit) {
    query += ' AND unit = ?';
    params.push(filters.unit);
  }
  
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const [rows] = await pool.execute(query, params);
  return rows;
}

/**
 * Get unique filter values for dropdowns
 */
export async function getFilterValues() {
  try {
    const queries = {
      courses: 'SELECT DISTINCT course FROM videos WHERE course IS NOT NULL AND course != "" ORDER BY course ASC',
      grades: 'SELECT DISTINCT grade FROM videos WHERE grade IS NOT NULL AND grade != "" ORDER BY grade ASC',
      lessons: 'SELECT DISTINCT lesson FROM videos WHERE lesson IS NOT NULL AND lesson != "" ORDER BY lesson ASC',
      modules: 'SELECT DISTINCT module FROM videos WHERE module IS NOT NULL AND module != "" ORDER BY module ASC',
      activities: 'SELECT DISTINCT activity FROM videos WHERE activity IS NOT NULL AND activity != "" ORDER BY activity ASC'
    };

    const [courses] = await pool.execute(queries.courses);
    const [grades] = await pool.execute(queries.grades);
    const [lessons] = await pool.execute(queries.lessons);
    const [modules] = await pool.execute(queries.modules);
    const [activities] = await pool.execute(queries.activities);

    return {
      courses: courses.map(row => row.course).filter(Boolean),
      grades: grades.map(row => row.grade).filter(Boolean),
      lessons: lessons.map(row => row.lesson).filter(Boolean),
      modules: modules.map(row => row.module).filter(Boolean),
      activities: activities.map(row => row.activity).filter(Boolean)
    };
  } catch (error) {
    console.error('Error fetching filter values:', error);
    // Return empty arrays if there's an error (e.g., column doesn't exist)
    return {
      courses: [],
      grades: [],
      lessons: [],
      modules: [],
      activities: []
    };
  }
}

/**
 * Update video metadata
 */
export async function updateVideo(id, updates) {
  const allowedFields = [
    'title', 'description', 'language', 'status', 'topic',
    'course', 'grade', 'lesson', 'module', 'activity',
    'streaming_url', 'file_path', 'thumbnail_url'
  ];
  
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      // Handle null values for optional fields
      if (value === '' || value === null) {
        fields.push(`${key} = NULL`);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  }
  
  if (fields.length === 0) {
    return null;
  }
  
  values.push(id);
  const query = `UPDATE videos SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  
  const [result] = await pool.execute(query, values);
  return result.affectedRows > 0;
}

/**
 * Delete video (soft delete)
 */
export async function deleteVideo(id) {
  const query = 'UPDATE videos SET status = "deleted", updated_at = NOW() WHERE id = ?';
  const [result] = await pool.execute(query, [id]);
  return result.affectedRows > 0;
}

/**
 * Get latest version number for a video ID
 */
export async function getLatestVersion(videoId) {
  const query = 'SELECT MAX(version) as maxVersion FROM videos WHERE video_id = ?';
  const [rows] = await pool.execute(query, [videoId]);
  return (rows[0]?.maxVersion || 0) + 1;
}

/**
 * Create video version entry
 */
export async function createVideoVersion(videoId, version, filePath, size) {
  const query = `
    INSERT INTO video_versions (video_id, version, file_path, size, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  
  const [result] = await pool.execute(query, [videoId, version, filePath, size]);
  return result.insertId;
}

/**
 * Get all versions for a video ID
 */
export async function getVideoVersions(videoId) {
  const query = 'SELECT * FROM video_versions WHERE video_id = ? ORDER BY version DESC';
  const [rows] = await pool.execute(query, [videoId]);
  return rows;
}

/**
 * Build streaming URL - Always use localhost for local streaming
 * This ensures videos are streamed from localhost instead of Cloudflare URLs
 */
export function buildStreamingUrl(relativePath, videoId = null, redirectSlug = null) {
  // Always use localhost streaming endpoint for proper range request support
  // Use redirect_slug if available (for short URLs like /s/:slug), otherwise use videoId
  if (redirectSlug) {
    return `${config.urls.base}/s/${redirectSlug}`;
  }
  if (videoId) {
    return `${config.urls.base}/api/videos/${videoId}/stream`;
  }
  // Fallback to static file serving if no videoId provided
  return `${config.cdn.localBaseUrl}${relativePath}`;
}

