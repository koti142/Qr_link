import { useEffect, useRef, useState } from 'react';

/**
 * HTML5 Video Player Component
 * 
 * Features:
 * - Native HTML5 video player with controls
 * - Automatic HLS detection and support via hls.js
 * - Fallback for native HLS support (Safari)
 * - Range request support for seeking
 * - Responsive design
 * - Error handling and loading states
 * 
 * @param {string} src - Video URL to stream
 * @param {Array} captions - Array of caption objects (optional)
 * @param {boolean} autoplay - Whether to autoplay video (default: false)
 * @param {string} poster - Poster image URL (optional)
 */
function VideoPlayer({ src, captions = [], autoplay = false, poster = null }) {
  // Reference to the video element
  const videoRef = useRef(null);
  // Reference to HLS instance (for HLS.js)
  const hlsRef = useRef(null);
  
  // State management
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHLS, setIsHLS] = useState(false);
  const [hlsSupported, setHlsSupported] = useState(false);
  
  // Check if URL is a mock Cloudflare URL - MUST match StreamPage's detection exactly
  const isMockUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const urlLower = url.toLowerCase();
    // Check for all known mock URL patterns - MUST match StreamPage
    return urlLower.includes('your-account.r2.cloudflarestorage.com') ||
           urlLower.includes('r2.cloudflarestorage.com') ||
           urlLower.includes('mock-cloudflare.example.com') ||
           (urlLower.includes('example.com') && !urlLower.includes('pub-')) ||
           urlLower.includes('test.cloudflare') ||
           (urlLower.includes('cloudflare.com/') && !urlLower.includes('pub-')) ||
           urlLower.includes('cloudflarestorage.com'); // Catch all cloudflarestorage.com URLs
  };
  
  // NEVER use mock URLs - StreamPage should have converted them, but add safety check
  // If we somehow receive a mock URL, don't use it
  const safeSrc = src && isMockUrl(src) ? null : src;

  /**
   * Check if browser natively supports HLS (Safari)
   */
  const checkNativeHLSSupport = () => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  };

  /**
   * Detect if URL is HLS stream (.m3u8)
   */
  const isHLSStream = (url) => {
    return url && (url.includes('.m3u8') || url.includes('application/vnd.apple.mpegurl'));
  };

  /**
   * Initialize HLS.js for browsers that don't support HLS natively
   */
  const initializeHLS = async (videoElement, videoSrc) => {
    try {
      // Dynamically import hls.js only when needed
      const Hls = (await import('hls.js')).default;
      
      if (Hls.isSupported()) {
        console.log('Using HLS.js for HLS stream playback');
        
        // Create new HLS instance
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          // CORS configuration
          xhrSetup: (xhr, url) => {
            xhr.withCredentials = false;
          }
        });

        // Load the source
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);

        // Error handling for HLS
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS Network Error - trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS Media Error - trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('HLS Fatal Error - cannot recover');
                hls.destroy();
                setError({ message: 'Failed to load HLS stream' });
                break;
            }
          }
        });

        // Store HLS instance for cleanup
        hlsRef.current = hls;
        setHlsSupported(true);
      } else {
        console.warn('HLS.js is not supported in this browser');
        setError({ message: 'HLS streaming is not supported in this browser' });
      }
    } catch (err) {
      console.error('Failed to load HLS.js:', err);
      setError({ message: 'Failed to initialize HLS player' });
    }
  };

  /**
   * Setup video element and load source
   */
  useEffect(() => {
    // StreamPage should have already converted mock URLs to local streaming URLs
    // But add safety check: NEVER load mock URLs
    
    // If no valid source, don't try to load
    if (!src || !videoRef.current) {
      setLoading(false);
      if (!src) {
        setError({ message: 'No video source provided' });
      }
      return;
    }
    
    // CRITICAL: If we somehow still get a mock URL, don't load it
    // StreamPage should have converted it, but if not, we'll skip loading
    if (isMockUrl(src)) {
      console.error('CRITICAL: Mock URL received in VideoPlayer! This should not happen. StreamPage should have converted it.');
      console.error('Mock URL:', src);
      setLoading(false);
      setError({ message: 'Invalid video URL. Please contact support.' });
      return; // Don't try to load mock URLs
    }

    const videoElement = videoRef.current;
    setLoading(true);
    setError(null);

    // Use safeSrc (which filters out mock URLs) - StreamPage should have already converted mock URLs
    // But add extra safety: if src is a mock URL, safeSrc will be null and we should not load
    if (!safeSrc) {
      console.error('No safe source available - mock URL detected or no source provided');
      setLoading(false);
      setError({ message: 'Invalid video source. Please contact support.' });
      return;
    }
    
    const videoSrc = safeSrc; // Use safeSrc which has mock URLs filtered out

    // Check if this is an HLS stream
    const isHLS = isHLSStream(videoSrc);
    setIsHLS(isHLS);

    if (isHLS) {
      // Check for native HLS support (Safari)
      if (checkNativeHLSSupport()) {
        console.log('Using native HLS support (Safari)');
        videoElement.src = videoSrc;
        setHlsSupported(true);
      } else {
        // Use HLS.js for other browsers
        initializeHLS(videoElement, videoSrc);
      }
    } else {
      // Regular MP4/WebM video - use native HTML5 player
      console.log('Using native HTML5 video player');
      videoElement.src = videoSrc;
    }

    // Event handlers for video element
    const handleLoadStart = () => {
      console.log('Video: Load started');
      setLoading(true);
    };

    const handleLoadedMetadata = () => {
      console.log('Video: Metadata loaded', {
        duration: videoElement.duration,
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
        readyState: videoElement.readyState
      });
      setLoading(false);
    };

    const handleCanPlay = () => {
      console.log('Video: Can start playing');
      setLoading(false);
    };

    const handleCanPlayThrough = () => {
      console.log('Video: Can play through without buffering');
      setLoading(false);
    };

    const handleError = (e) => {
      console.error('Video error:', e);
      const videoError = videoElement.error;
      
      let errorMessage = 'Failed to load video';
      if (videoError) {
        switch (videoError.code) {
          case videoError.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading aborted';
            break;
          case videoError.MEDIA_ERR_NETWORK:
            // Don't show errors for mock URLs - StreamPage should have handled fallback
            if (src && isMockUrl(src)) {
              // Silent fallback - don't show error, StreamPage will use local file
              console.log('Network error for mock URL (expected), StreamPage should handle fallback');
              return; // Don't set error for mock URLs
            } else {
              errorMessage = 'Network error while loading video. The video URL may be inaccessible or the server may be down.';
            }
            break;
          case videoError.MEDIA_ERR_DECODE:
            errorMessage = 'Video decoding error. The video file may be corrupted.';
            break;
          case videoError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            // Don't show errors for mock URLs - StreamPage should have handled fallback
            if (src && isMockUrl(src)) {
              // Silent fallback - don't show error, StreamPage will use local file
              console.log('Source not supported for mock URL (expected), StreamPage should handle fallback');
              return; // Don't set error for mock URLs
            }
            // Check if it's a localhost URL - these should work, so show a different error
            if (src && (src.includes('localhost') || src.includes('127.0.0.1'))) {
              errorMessage = 'Video format not supported or file may be missing. Please check if the video file exists on the server.';
            } else if (src && (src.includes('cloudflare') || src.startsWith('http'))) {
              errorMessage = 'Video URL not accessible. The Cloudflare URL may be invalid, the video may not exist, or there may be SSL/CORS issues.';
            } else {
              errorMessage = 'Video format not supported. The local file may be missing or corrupted.';
            }
            break;
          default:
            errorMessage = `Video error (code: ${videoError.code})`;
        }
      } else {
        // Network-level error (like SSL errors)
        // Don't show errors for mock URLs - StreamPage should have handled fallback
        if (src && isMockUrl(src)) {
          // Silent fallback - don't show error, StreamPage will use local file
          console.log('Network error for mock URL (expected), StreamPage should handle fallback');
          return; // Don't set error for mock URLs
        }
      }
      
      setError({ message: errorMessage });
      setLoading(false);
    };

    const handleWaiting = () => {
      console.log('Video: Buffering...');
      setLoading(true);
    };

    const handlePlaying = () => {
      console.log('Video: Playing');
      setLoading(false);
    };

    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const duration = videoElement.duration;
        const bufferedPercent = (bufferedEnd / duration) * 100;
        console.log('Video progress:', {
          buffered: `${bufferedPercent.toFixed(1)}%`,
          currentTime: videoElement.currentTime,
          duration: duration
        });
      }
    };

    // Attach event listeners
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('progress', handleProgress);

    // Cleanup function
    return () => {
      // Remove event listeners
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('progress', handleProgress);

      // Cleanup HLS instance if it exists
      if (hlsRef.current) {
        console.log('Destroying HLS instance');
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Reset video source
      videoElement.src = '';
      videoElement.load();
    };
  }, [src]);

  // Handle autoplay
  useEffect(() => {
    if (autoplay && videoRef.current && !loading && !error) {
      videoRef.current.play().catch(err => {
        console.warn('Autoplay prevented:', err);
      });
    }
  }, [autoplay, loading, error]);

  if (!src) {
    return (
      <div className="w-full h-96 bg-gray-900 flex items-center justify-center text-white rounded-lg">
        <p>No video source provided</p>
      </div>
    );
  }

  return (
    <div className="w-full relative bg-black rounded-lg overflow-hidden">
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading video...</p>
            {isHLS && <p className="text-white text-sm mt-2">Initializing HLS stream...</p>}
          </div>
        </div>
      )}

      {/* Error display - Don't show errors for mock URLs (they auto-fallback silently) */}
      {error && !(src && isMockUrl(src)) && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center max-w-md p-4">
            <p className="font-bold mb-2 text-lg text-white">Video Error</p>
            <p className="text-sm text-white mb-4">{error.message}</p>
            <p className="text-xs text-white opacity-75 mb-4 break-all">URL: {src}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video element container with responsive aspect ratio */}
      <div className="w-full relative" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          controls
          preload="auto"
          playsInline
          autoPlay={autoplay}
          crossOrigin="anonymous"
          poster={poster || undefined}
          style={{
            objectFit: 'contain',
            backgroundColor: '#000'
          }}
        >
          {/* Caption tracks */}
          {captions && captions.length > 0 && captions.map((caption, index) => (
            <track
              key={index}
              kind="subtitles"
              srcLang={caption.language || 'en'}
              src={caption.url}
              label={caption.label || caption.language || 'English'}
              default={index === 0}
            />
          ))}
          
          {/* Fallback message for browsers that don't support video */}
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Video info (for debugging - can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-16 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 pointer-events-none">
          <div className="flex justify-between">
            <span>Format: {isHLS ? 'HLS' : 'MP4/WebM'}</span>
            <span>HLS Support: {hlsSupported ? 'Yes' : 'No'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
