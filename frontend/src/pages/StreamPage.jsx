import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import api from '../services/api';

function StreamPage() {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerError, setPlayerError] = useState(null);

  useEffect(() => {
    if (!videoId) {
      setError('Video ID is required');
      setLoading(false);
      return;
    }

    const fetchVideo = async () => {
      try {
        // First, try to get video by videoId
        let response;
        try {
          response = await api.get(`/videos/${videoId}`);
          if (response.data) {
            setVideo(response.data);
            setLoading(false);
            return;
          }
        } catch (err) {
          // If not found, try to check if it's a short slug
          console.log('Video not found by ID, checking if it\'s a short slug...');
        }

        // If video not found, try to get redirect info (might be a short slug)
        try {
          const redirectResponse = await api.get(`/videos/redirect-info/${videoId}`);
          if (redirectResponse.data && redirectResponse.data.target_url) {
            // Extract videoId from target URL (e.g., /stream/videoId)
            const targetUrl = redirectResponse.data.target_url;
            const url = new URL(targetUrl);
            const pathParts = url.pathname.split('/');
            const actualVideoId = pathParts[pathParts.length - 1];
            
            // Fetch video with actual videoId
            response = await api.get(`/videos/${actualVideoId}`);
            if (response.data) {
              setVideo(response.data);
              setLoading(false);
              return;
            }
          }
        } catch (redirectErr) {
          console.log('Redirect lookup failed:', redirectErr);
        }

        // If we get here, video not found
        setError('Video not found');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.response?.data?.error || 'Failed to load video');
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-white mb-4">{error || 'Video not found'}</p>
          <p className="text-gray-400 text-sm">Please check the video link or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }

  // Helper function to detect mock URLs - MUST be comprehensive and work correctly
  const isMockUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const urlLower = url.toLowerCase();
    // Check for all known mock URL patterns
    return urlLower.includes('your-account.r2.cloudflarestorage.com') ||
           urlLower.includes('r2.cloudflarestorage.com') ||
           urlLower.includes('mock-cloudflare.example.com') ||
           (urlLower.includes('example.com') && !urlLower.includes('pub-')) ||
           urlLower.includes('test.cloudflare') ||
           (urlLower.includes('cloudflare.com/') && !urlLower.includes('pub-')) ||
           urlLower.includes('cloudflarestorage.com'); // Catch all cloudflarestorage.com URLs
  };
  
  // Check if video has a Cloudflare URL (remote URL) - check BOTH fields
  const cloudflareUrl = video.streaming_url || video.file_path;
  const isCloudflareUrl = cloudflareUrl && (cloudflareUrl.startsWith('http://') || cloudflareUrl.startsWith('https://'));
  
  // ALWAYS check for mock URLs first, regardless of isCloudflareUrl
  // This ensures we catch mock URLs even if they're in file_path instead of streaming_url
  const isMock = cloudflareUrl ? isMockUrl(cloudflareUrl) : false;
  
  // Log for debugging
  console.log('[StreamPage] URL Analysis:', {
    streaming_url: video.streaming_url,
    file_path: video.file_path,
    cloudflareUrl,
    isCloudflareUrl,
    isMock,
    video_id: video.video_id,
    redirect_slug: video.redirect_slug
  });
  
  let streamingUrl;
  let urlError = null;
  
  // ALWAYS convert mock URLs to local streaming URLs - never pass mock URLs to VideoPlayer
  if (isMock) {
    // Mock URL detected - ALWAYS use local streaming endpoint (never pass mock URL to VideoPlayer)
    console.log('[StreamPage] Mock Cloudflare URL detected, converting to local streaming:', cloudflareUrl);
    
    // Use the streaming endpoint URL for local files
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const streamIdentifier = video.redirect_slug || video.video_id;
    streamingUrl = `${backendUrl}/s/${streamIdentifier}`;
    console.log('[StreamPage] Converted to local streaming endpoint:', streamingUrl);
    // Don't set urlError - work silently
  } else if (isCloudflareUrl && !isMock) {
    // Use REAL Cloudflare URL directly - this should work for actual Cloudflare storage
    // But double-check it's not a mock URL before using
    if (isMockUrl(cloudflareUrl)) {
      // Safety check: if somehow we got here but it's still a mock URL, use local
      console.warn('[StreamPage] Safety check: Detected mock URL in real Cloudflare branch, using local fallback');
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const streamIdentifier = video.redirect_slug || video.video_id;
      streamingUrl = `${backendUrl}/s/${streamIdentifier}`;
    } else {
      streamingUrl = cloudflareUrl;
      console.log('[StreamPage] Using real Cloudflare URL directly:', streamingUrl);
    }
  } else {
    // For local files (no URL), use local streaming endpoint
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const streamIdentifier = video.redirect_slug || video.video_id;
    streamingUrl = `${backendUrl}/s/${streamIdentifier}`;
    console.log('[StreamPage] Using local streaming endpoint:', streamingUrl);
  }
  
  // Final safety check: NEVER pass a mock URL to VideoPlayer
  if (streamingUrl && isMockUrl(streamingUrl)) {
    console.error('[StreamPage] CRITICAL: Attempted to pass mock URL to VideoPlayer! Converting to local URL.');
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const streamIdentifier = video.redirect_slug || video.video_id;
    streamingUrl = `${backendUrl}/s/${streamIdentifier}`;
    console.log('[StreamPage] Final conversion to local URL:', streamingUrl);
  }
  
  // Log final streaming URL for debugging
  console.log('[StreamPage] Final streaming URL that will be passed to VideoPlayer:', streamingUrl);
  
  console.log('Video ID:', video.video_id);
  console.log('Short Slug:', video.redirect_slug);
  console.log('Streaming URL:', streamingUrl);
  console.log('Is Cloudflare URL:', isCloudflareUrl);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        {streamingUrl && video ? (
          <>
            {/* Video Title */}
            {video.title && (
              <div className="mb-4 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
                {video.description && (
                  <p className="text-gray-300 text-sm max-w-3xl mx-auto">{video.description}</p>
                )}
              </div>
            )}
            
            {/* URL Error Warning - Only show for real errors, not mock URLs (they auto-fallback) */}
            {urlError && !isMock && (
              <div className="mb-4 p-5 bg-yellow-900 border-2 border-yellow-600 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-yellow-200 mb-2">Streaming Notice</p>
                    <p className="text-yellow-100 text-sm mb-3">{urlError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Stream Error (from backend) - using urlError instead of streamError */}
            {urlError && (
              <div className="mb-4 p-5 bg-red-900 border-2 border-red-600 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-200 mb-2">Streaming Error</p>
                    <p className="text-red-100 text-sm">{urlError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
              <VideoPlayer 
                src={streamingUrl} 
                captions={video.captions || []} 
                autoplay={true}
              />
            </div>
            
            {playerError && (
              <div className="mt-4 p-4 bg-red-900 text-white rounded">
                <p className="font-bold">Error loading video:</p>
                <p className="mt-2">{playerError}</p>
                <p className="text-sm mt-3 text-gray-300">Please try refreshing the page or contact support if the problem persists.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-white text-center">
            <p>Streaming URL not available</p>
            <p className="text-sm mt-2 text-gray-400">Please contact support if this issue persists.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StreamPage;

