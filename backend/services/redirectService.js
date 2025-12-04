import pool from '../config/database.js';
import config from '../config/config.js';
import { generateUniqueShortId } from '../utils/shortUrlGenerator.js';

/**
 * Create redirect entry with short URL
 * Returns both the original slug and a short URL slug
 */
export async function createRedirect(slug, targetUrl, useShortUrl = true) {
  let shortSlug = slug;
  
  // Generate short URL if requested
  if (useShortUrl) {
    try {
      shortSlug = await generateUniqueShortId();
      console.log(`Generated short URL slug: ${shortSlug} for video: ${slug}`);
    } catch (error) {
      console.warn('Failed to generate short URL, using original slug:', error.message);
      shortSlug = slug;
    }
  }
  
  // Create redirect with short slug
  const query = 'INSERT INTO redirects (slug, target_url) VALUES (?, ?) ON DUPLICATE KEY UPDATE target_url = ?';
  const [result] = await pool.execute(query, [shortSlug, targetUrl, targetUrl]);
  
  // Also create redirect for original slug if different
  if (shortSlug !== slug) {
    try {
      await pool.execute(query, [slug, targetUrl, targetUrl]);
    } catch (error) {
      // Ignore if original slug already exists
    }
  }
  
  return {
    insertId: result.insertId,
    shortSlug,
    shortUrl: `${config.urls.base}/${shortSlug}`
  };
}

/**
 * Get redirect by slug
 */
export async function getRedirectBySlug(slug) {
  const query = 'SELECT * FROM redirects WHERE slug = ? LIMIT 1';
  const [rows] = await pool.execute(query, [slug]);
  return rows[0] || null;
}

/**
 * Get all redirects
 */
export async function getAllRedirects() {
  const query = 'SELECT * FROM redirects ORDER BY created_at DESC';
  const [rows] = await pool.execute(query);
  return rows;
}

/**
 * Delete redirect
 */
export async function deleteRedirect(slug) {
  const query = 'DELETE FROM redirects WHERE slug = ?';
  const [result] = await pool.execute(query, [slug]);
  return result.affectedRows > 0;
}

/**
 * Build redirect URL
 */
export function buildRedirectUrl(slug) {
  return `${config.urls.base}/${slug}`;
}





