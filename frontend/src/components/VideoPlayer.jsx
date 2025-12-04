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
    if (!src || !videoRef.current) return;

    const videoElement = videoRef.current;
    setLoading(true);
    setError(null);

    // Check if this is an HLS stream
    const isHLS = isHLSStream(src);
    setIsHLS(isHLS);

    if (isHLS) {
      // Check for native HLS support (Safari)
      if (checkNativeHLSSupport()) {
        console.log('Using native HLS support (Safari)');
        videoElement.src = src;
        setHlsSupported(true);
      } else {
        // Use HLS.js for other browsers
        initializeHLS(videoElement, src);
      }
    } else {
      // Regular MP4/WebM video - use native HTML5 player
      console.log('Using native HTML5 video player');
      videoElement.src = src;
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
            errorMessage = 'Network error while loading video';
            break;
          case videoError.MEDIA_ERR_DECODE:
            errorMessage = 'Video decoding error';
            break;
          case videoError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            break;
          default:
            errorMessage = `Video error (code: ${videoError.code})`;
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

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center max-w-md p-4">
            <p className="font-bold mb-2 text-lg text-white">Video Error</p>
            <p className="text-sm text-white mb-4">{error.message}</p>
            <p className="text-xs text-white opacity-75 mb-4 break-all">URL: {src}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Video element container with responsive aspect ratio */}
      <div className="w-full relative" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          controls
          preload="metadata"
          playsInline
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
