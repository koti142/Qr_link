import config from '../config/config.js';

/**
 * Get the base URL for the backend
 * Uses the request's host if available, otherwise falls back to config
 * This ensures URLs work correctly in both development and production
 */
export function getBaseUrl(req = null) {
  // If request is provided, use the actual request host
  if (req) {
    // Detect protocol - check X-Forwarded-Proto header (for proxies/load balancers)
    // or req.secure, or default to http
    let protocol = 'http';
    if (req.get('x-forwarded-proto')) {
      protocol = req.get('x-forwarded-proto').split(',')[0].trim();
    } else if (req.secure || req.protocol === 'https') {
      protocol = 'https';
    } else if (req.protocol) {
      protocol = req.protocol;
    }
    
    // Get host - check X-Forwarded-Host header first (for proxies), then req.get('host')
    const host = req.get('x-forwarded-host') || 
                 req.get('host') || 
                 req.hostname || 
                 'localhost:5000';
    
    return `${protocol}://${host}`;
  }
  
  // Otherwise, use config (which should be set via environment variable)
  // But if config is still localhost and we're in production, try to detect
  if (config.urls.base === 'http://localhost:5000' && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  BASE_URL is still set to localhost in production. Set BASE_URL environment variable.');
  }
  
  return config.urls.base;
}

/**
 * Build streaming URL using the correct base URL
 * @param {Object} req - Express request object (optional)
 * @param {string} redirectSlug - The redirect slug for the video
 * @param {string} videoId - The video ID (fallback if no redirectSlug)
 * @returns {string} The streaming URL
 */
export function buildStreamingUrl(req = null, redirectSlug = null, videoId = null) {
  const baseUrl = getBaseUrl(req);
  
  // Use redirect_slug if available (for short URLs like /s/:slug)
  if (redirectSlug) {
    return `${baseUrl}/s/${redirectSlug}`;
  }
  
  // Fallback to videoId endpoint
  if (videoId) {
    return `${baseUrl}/api/videos/${videoId}/stream`;
  }
  
  return null;
}

/**
 * Get the frontend URL
 * Uses config which should be set via environment variable
 */
export function getFrontendUrl() {
  return config.urls.frontend;
}

