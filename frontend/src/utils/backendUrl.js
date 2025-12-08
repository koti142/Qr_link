/**
 * Get the backend URL for API and streaming requests
 * Automatically detects production vs development environment
 */
export function getBackendUrl() {
  // Check if VITE_API_URL is explicitly set
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    // Remove /api suffix if present, we'll add it back when needed
    return envApiUrl.replace('/api', '');
  }

  // In production, try to detect backend URL from current domain
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const currentPort = window.location.port;

    // If we're on a production domain (not localhost), use same domain for backend
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      // Check if backend is on same domain (common in production)
      // Or use a subdomain pattern like api.yourdomain.com
      const backendHost = currentHost.startsWith('www.') 
        ? currentHost.replace('www.', 'api.') 
        : `api.${currentHost}`;
      
      // Try same domain first (most common in production)
      const sameDomainUrl = `${currentProtocol}//${currentHost}${currentPort ? `:${currentPort}` : ''}`;
      
      // Return same domain URL (backend should be on same domain in production)
      return sameDomainUrl;
    }
  }

  // Default to localhost for development
  return 'http://localhost:5000';
}

/**
 * Get the full API URL (includes /api)
 */
export function getApiUrl() {
  const backendUrl = getBackendUrl();
  return `${backendUrl}/api`;
}

/**
 * Get the streaming URL for a video
 */
export function getStreamingUrl(videoId, redirectSlug = null) {
  const backendUrl = getBackendUrl();
  const identifier = redirectSlug || videoId;
  return `${backendUrl}/s/${identifier}`;
}

