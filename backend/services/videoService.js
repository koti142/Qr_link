import pool from '../config/database.js';

export async function getAllVideos(filters = {}) {
  let query = 'SELECT * FROM videos WHERE 1=1';
  const params = [];
  
  if (filters.search) {
    query += ` AND (title LIKE ? OR description LIKE ? OR video_id LIKE ? OR course LIKE ? OR grade LIKE ? OR lesson LIKE ? OR module LIKE ? OR activity LIKE ? OR topic LIKE ?)`;
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
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  query += ' ORDER BY created_at DESC';
  const [rows] = await pool.execute(query, params);
  return rows;
}

export async function getFilterValues() {
  const [courses] = await pool.execute('SELECT DISTINCT course FROM videos WHERE course IS NOT NULL ORDER BY course');
  const [grades] = await pool.execute('SELECT DISTINCT grade FROM videos WHERE grade IS NOT NULL ORDER BY grade');
  const [lessons] = await pool.execute('SELECT DISTINCT lesson FROM videos WHERE lesson IS NOT NULL ORDER BY lesson');
  const [modules] = await pool.execute('SELECT DISTINCT module FROM videos WHERE module IS NOT NULL ORDER BY module');
  const [activities] = await pool.execute('SELECT DISTINCT activity FROM videos WHERE activity IS NOT NULL ORDER BY activity');
  
  return {
    courses: courses.map(row => row.course),
    grades: grades.map(row => row.grade),
    lessons: lessons.map(row => row.lesson),
    modules: modules.map(row => row.module),
    activities: activities.map(row => row.activity)
  };
}

export async function getVideoById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM videos WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

export async function getVideoByVideoId(videoId, includeInactive = false) {
  let query = 'SELECT * FROM videos WHERE video_id = ?';
  const params = [videoId];
  
  if (!includeInactive) {
    query += ' AND status = "active"';
  }
  
  query += ' ORDER BY version DESC LIMIT 1';
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
}

export async function getLatestVersion(videoId) {
  const [rows] = await pool.execute(
    'SELECT MAX(version) as max_version FROM videos WHERE video_id = ?',
    [videoId]
  );
  return (rows[0]?.max_version || 0) + 1;
}

export async function createVideo(videoData) {
  const [result] = await pool.execute(
    `INSERT INTO videos (
      video_id, title, course, grade, lesson, module, activity, topic,
      description, language, file_path, streaming_url, qr_url, thumbnail_url,
      redirect_slug, duration, size, version, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      videoData.videoId,
      videoData.title,
      videoData.course || null,
      videoData.grade || null,
      videoData.lesson || null,
      videoData.module || null,
      videoData.activity || null,
      videoData.topic || null,
      videoData.description || '',
      videoData.language || 'en',
      videoData.filePath,
      videoData.streamingUrl,
      videoData.qrUrl || null,
      videoData.thumbnailUrl || null,
      videoData.redirectSlug,
      videoData.duration || 0,
      videoData.size || 0,
      videoData.version || 1,
      videoData.status || 'active'
    ]
  );
  return result.insertId;
}

export async function updateVideo(id, updates) {
  const fields = [];
  const values = [];
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });
  
  if (fields.length === 0) {
    return false;
  }
  
  values.push(id);
  const [result] = await pool.execute(
    `UPDATE videos SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  
  return result.affectedRows > 0;
}

export async function getVideoVersions(videoId) {
  const [rows] = await pool.execute(
    'SELECT * FROM video_versions WHERE video_id = ? ORDER BY version DESC',
    [videoId]
  );
  return rows;
}

export async function createVideoVersion(videoId, version, filePath, size) {
  const [result] = await pool.execute(
    'INSERT INTO video_versions (video_id, version, file_path, size) VALUES (?, ?, ?, ?)',
    [videoId, version, filePath, size]
  );
  return result.insertId;
}

export function buildStreamingUrl(relativePath, videoId) {
  return `/api/videos/${videoId}/stream`;
}

