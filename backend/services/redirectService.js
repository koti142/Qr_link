import pool from '../config/database.js';

export async function getRedirect(slug) {
  const [rows] = await pool.execute(
    'SELECT * FROM redirects WHERE slug = ?',
    [slug]
  );
  return rows[0] || null;
}

export async function getAllRedirects() {
  const [rows] = await pool.execute(
    'SELECT * FROM redirects ORDER BY created_at DESC'
  );
  return rows;
}

export async function createRedirect(slug, url) {
  const [result] = await pool.execute(
    'INSERT INTO redirects (slug, url) VALUES (?, ?) ON DUPLICATE KEY UPDATE url = ?',
    [slug, url, url]
  );
  
  return await getRedirect(slug);
}

export async function deleteRedirect(slug) {
  const [result] = await pool.execute(
    'DELETE FROM redirects WHERE slug = ?',
    [slug]
  );
  return result.affectedRows > 0;
}

