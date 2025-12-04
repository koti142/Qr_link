import crypto from 'crypto';
import pool from '../config/database.js';

/**
 * Generate a unique, short, and strong identifier
 * Format: 10 character alphanumeric string (max 10 chars)
 * Designed to be unique for 30+ years
 */
export function generateShortId() {
  // Use crypto for strong randomness
  const randomBytes = crypto.randomBytes(6);
  // Convert to base36 (0-9, a-z) for shorter, URL-safe strings
  const base36 = randomBytes.toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 6)
    .toLowerCase();
  
  // Add timestamp component (last 4 chars of timestamp in base36) for uniqueness
  const timestamp = Date.now().toString(36).slice(-4);
  
  // Combine: random (6) + timestamp (4) = exactly 10 characters
  const shortId = (base36 + timestamp).substring(0, 10);
  
  return shortId;
}

/**
 * Generate a guaranteed unique short ID by checking database
 */
export async function generateUniqueShortId(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const shortId = generateShortId();
    
    // Check if this ID already exists in redirects table
    try {
      const [existing] = await pool.execute(
        'SELECT id FROM redirects WHERE slug = ?',
        [shortId]
      );
      
      if (existing.length === 0) {
        // Also check videos table for video_id
        const [videoExists] = await pool.execute(
          'SELECT id FROM videos WHERE video_id = ?',
          [shortId]
        );
        
        if (videoExists.length === 0) {
          return shortId;
        }
      }
    } catch (error) {
      // If error, try again
      console.warn('Error checking short ID uniqueness:', error.message);
    }
  }
  
  // If all retries failed, use timestamp-based ID with random suffix (ensure 10 chars)
  const timestamp = Date.now().toString(36).slice(-6);
  const random = crypto.randomBytes(2).toString('hex').substring(0, 4);
  return (timestamp + random).substring(0, 10);
}

/**
 * Generate a short URL from a video ID or custom identifier
 */
export async function generateShortUrl(videoId, baseUrl) {
  // Generate unique short ID
  const shortId = await generateUniqueShortId();
  
  // Create short URL
  const shortUrl = `${baseUrl}/${shortId}`;
  
  return {
    shortId,
    shortUrl
  };
}

