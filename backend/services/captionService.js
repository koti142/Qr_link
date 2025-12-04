import pool from '../config/database.js';

export async function getCaptionsByVideoId(videoId) {
  const [rows] = await pool.execute(
    'SELECT * FROM captions WHERE video_id = ? ORDER BY start_time',
    [videoId]
  );
  return rows;
}

