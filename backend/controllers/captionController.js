import pool from '../config/database.js';

export async function getCaptions(req, res) {
  try {
    const { videoId } = req.params;
    
    const [captions] = await pool.execute(
      'SELECT * FROM captions WHERE video_id = ? ORDER BY start_time',
      [videoId]
    );

    res.json(captions);
  } catch (error) {
    console.error('Get captions error:', error);
    res.status(500).json({ error: 'Failed to fetch captions' });
  }
}

export async function uploadCaption(req, res) {
  try {
    const { videoId, language, file_path } = req.body;
    
    if (!videoId || !language || !file_path) {
      return res.status(400).json({ error: 'Video ID, language, and file path required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO captions (video_id, language, file_path) VALUES (?, ?, ?)',
      [videoId, language, file_path]
    );

    res.status(201).json({ 
      message: 'Caption uploaded successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Upload caption error:', error);
    res.status(500).json({ error: 'Failed to upload caption' });
  }
}

export async function deleteCaption(req, res) {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM captions WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Caption not found' });
    }

    res.json({ message: 'Caption deleted successfully' });
  } catch (error) {
    console.error('Delete caption error:', error);
    res.status(500).json({ error: 'Failed to delete caption' });
  }
}

