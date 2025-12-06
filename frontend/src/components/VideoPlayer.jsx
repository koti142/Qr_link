import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';
import { AlertCircle } from 'lucide-react';
import VideoDiagnostic from './VideoDiagnostic';

// Custom styles for Video.js player - Professional YouTube-like appearance
const videoPlayerStyles = `
  .video-js {
    width: 100% !important;
    height: 100% !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
  }
  .video-js .vjs-tech {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  /* Professional control bar - always visible with smooth gradient */
  .video-js .vjs-control-bar {
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, transparent 100%);
    height: 52px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    opacity: 1 !important;
    visibility: visible !important;
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .video-js.vjs-user-inactive .vjs-control-bar {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* Better button styling */
  .video-js .vjs-button {
    color: #fff;
    transition: opacity 0.2s;
  }
  .video-js .vjs-button:hover {
    opacity: 0.8;
  }
  /* Play/Pause button - ensure it toggles correctly */
  .video-js .vjs-play-control {
    cursor: pointer;
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  .video-js .vjs-play-control.vjs-playing .vjs-icon-placeholder::before {
    content: "\\f101"; /* Pause icon */
  }
  .video-js .vjs-play-control.vjs-paused .vjs-icon-placeholder::before {
    content: "\\f101"; /* Play icon */
  }
  /* Progress bar styling - positioned at top */
  .video-js .vjs-progress-control {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    width: 100%;
    margin: 0;
    z-index: 10;
    cursor: pointer;
    order: 0 !important;
  }
  .video-js .vjs-progress-control:hover {
    height: 6px;
  }
  .video-js .vjs-progress-control:hover .vjs-progress-holder {
    height: 6px;
  }
  .video-js .vjs-progress-holder {
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
  }
  .video-js .vjs-play-progress {
    background: #ff0000;
    border-radius: 2px;
  }
  .video-js .vjs-load-progress {
    background: rgba(255,255,255,0.4);
    border-radius: 2px;
  }
  /* Time display */
  .video-js .vjs-time-control {
    font-size: 13px;
    line-height: 48px;
    min-width: 50px;
  }
  /* Volume control */
  .video-js .vjs-volume-control {
    margin: 0 8px;
  }
  /* Fullscreen button */
  .video-js .vjs-fullscreen-control {
    margin-left: auto;
  }
  /* Picture-in-Picture button - right side */
  .video-js .vjs-picture-in-picture-control {
    cursor: pointer;
    order: 3;
  }
  .video-js .vjs-picture-in-picture-control.vjs-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* Closed Captions button - right side */
  .video-js .vjs-subs-caps-button {
    order: 3;
  }
  /* Settings/Playback Rate button - YouTube style, right side */
  .video-js .vjs-playback-rate {
    order: 3;
  }
  .video-js .vjs-playback-rate .vjs-menu-button {
    font-size: 13px;
    font-weight: 500;
  }
  .video-js .vjs-playback-rate .vjs-menu-button-label {
    padding: 0 4px;
  }
  /* Fullscreen button - right side */
  .video-js .vjs-fullscreen-control {
    order: 3;
    margin-left: 4px;
  }
  /* Control bar layout - properly arranged controls */
  .video-js .vjs-control-bar {
    display: flex !important;
    align-items: center !important;
    padding: 0 16px !important;
    height: 52px !important;
  }
  /* Play/Pause button - first on left */
  .video-js .vjs-control-bar > .vjs-play-control {
    order: 1;
    margin-right: 12px;
    min-width: 40px;
    height: 40px;
    display: flex !important;
    visibility: visible !important;
  }
  /* Volume panel - second */
  .video-js .vjs-control-bar > .vjs-volume-panel {
    order: 2;
    margin-right: 12px;
    display: flex !important;
    visibility: visible !important;
  }
  /* Current time - third */
  .video-js .vjs-control-bar > .vjs-current-time {
    order: 3;
    margin-right: 4px;
    display: flex !important;
    visibility: visible !important;
  }
  /* Time divider "/" - fourth */
  .video-js .vjs-control-bar > .vjs-time-divider {
    order: 4;
    margin: 0 4px;
    display: flex !important;
    visibility: visible !important;
  }
  /* Duration - fifth */
  .video-js .vjs-control-bar > .vjs-duration {
    order: 5;
    margin-left: 4px;
    display: flex !important;
    visibility: visible !important;
  }
  /* Progress bar is positioned absolutely at top, not in flex order */
  .video-js .vjs-control-bar > .vjs-progress-control {
    order: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    margin: 0;
    height: 4px;
  }
  /* Spacer to push controls to right */
  .video-js .vjs-control-bar > .vjs-spacer {
    order: 2;
    flex: 1 1 auto;
    min-width: 0;
  }
  /* Control bar - right side controls */
  /* Show playback rate button - make it visible and functional */
  .video-js .vjs-control-bar > .vjs-playback-rate {
    order: 6;
    margin-left: 8px;
    display: flex !important; /* Always visible */
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    cursor: pointer !important;
    position: relative;
  }
  /* Display selected speed below button */
  .video-js .vjs-control-bar > .vjs-playback-rate::after {
    content: attr(data-selected-speed);
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0.9;
    font-weight: 500;
  }
  /* When menu is open, make it more prominent */
  .video-js .vjs-control-bar > .vjs-playback-rate.vjs-menu-button-open {
    z-index: 1000;
  }
  .video-js .vjs-control-bar > .vjs-playback-rate.vjs-menu-button-open .vjs-menu {
    z-index: 1001;
  }
  /* Hide captions button completely */
  .video-js .vjs-control-bar > .vjs-subs-caps-button {
    display: none !important;
    visibility: hidden !important;
  }
  .video-js .vjs-control-bar > .vjs-picture-in-picture-control {
    order: 7;
    margin-left: 4px;
  }
  .video-js .vjs-control-bar > .vjs-fullscreen-control {
    order: 8;
    margin-left: 4px;
  }
  /* Ensure all buttons are visible and properly sized */
  .video-js .vjs-control-bar .vjs-button {
    width: auto;
    min-width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    border-radius: 2px;
    transition: background-color 0.2s;
  }
  .video-js .vjs-control-bar .vjs-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  /* Hide chapters and descriptions if not available */
  .video-js .vjs-chapters-button:not(.vjs-hidden),
  .video-js .vjs-descriptions-button:not(.vjs-hidden) {
    display: none;
  }
  /* Hide audio track button if not needed */
  .video-js .vjs-audio-button:not(.vjs-hidden) {
    display: none;
  }
  /* Control bar positioning */
  .video-js .vjs-control-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 5;
  }
  /* Better volume control styling */
  .video-js .vjs-volume-panel {
    order: 1;
    margin-right: 8px;
  }
  .video-js .vjs-volume-panel .vjs-volume-control {
    width: 80px;
    margin-right: 8px;
  }
  /* Time display styling */
  .video-js .vjs-current-time,
  .video-js .vjs-duration {
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  .video-js .vjs-time-divider {
    font-size: 13px;
    color: #fff;
    margin: 0 4px;
  }
  /* Hide scrollbar in playback rate menu - clean UI */
  .video-js .vjs-playback-rate .vjs-menu {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .video-js .vjs-playback-rate .vjs-menu::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  .video-js .vjs-playback-rate .vjs-menu-content {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .video-js .vjs-playback-rate .vjs-menu-content::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  /* Hide scrollbar in all Video.js menus */
  .video-js .vjs-menu {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .video-js .vjs-menu::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  .video-js .vjs-menu-content {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .video-js .vjs-menu-content::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  /* Professional big play button - Modern circular style */
  .video-js .vjs-big-play-button {
    width: 80px;
    height: 80px;
    line-height: 80px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    border: 3px solid rgba(255, 255, 255, 0.9);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    cursor: pointer !important;
    pointer-events: auto !important;
    display: block !important;
    visibility: visible !important;
    z-index: 100 !important;
  }
  .video-js .vjs-big-play-button:hover {
    background: rgba(0, 0, 0, 0.85);
    border-color: #fff;
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }
  .video-js .vjs-big-play-button:active {
    transform: translate(-50%, -50%) scale(0.95);
  }
  /* Hide big play button when playing */
  .video-js.vjs-playing .vjs-big-play-button {
    display: none !important;
  }
  /* Show big play button when paused */
  .video-js.vjs-paused .vjs-big-play-button {
    display: block !important;
  }
  .video-js .vjs-big-play-button .vjs-icon-placeholder:before {
    font-size: 32px;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  /* Always show controls - YouTube style */
  .video-js.vjs-user-inactive .vjs-control-bar {
    opacity: 1 !important; /* Always visible */
    transition: none;
  }
  .video-js.vjs-user-active .vjs-control-bar {
    opacity: 1 !important;
    transition: none;
  }
  /* Quality selector styling */
  .video-js .vjs-menu-button-popup .vjs-menu {
    background: rgba(28, 28, 28, 0.9);
    border-radius: 4px;
    padding: 4px 0;
  }
  .video-js .vjs-menu li {
    color: #fff;
    padding: 8px 16px;
    font-size: 14px;
  }
  .video-js .vjs-menu li:hover,
  .video-js .vjs-menu li.vjs-selected {
    background: rgba(255, 255, 255, 0.1);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = videoPlayerStyles;
  document.head.appendChild(styleSheet);
}

/**
 * Video.js Player Component
 * 
 * Features:
 * - Video.js player with professional controls
 * - HLS streaming support (.m3u8)
 * - Quality selector for HLS streams (if available)
 * - Captions/subtitles support (.vtt)
 * - Download disabled
 * - Right-click disabled
 * - Picture-in-picture disabled
 * - Responsive 16:9 design
 * - Clean and minimal UI
 * 
 * @param {string} src - Video URL to stream
 * @param {Array} captions - Array of caption objects (optional)
 * @param {boolean} autoplay - Whether to autoplay video (default: false)
 * @param {string} poster - Poster image URL (optional)
 * @param {string} videoId - Video ID for diagnostics (optional)
 */
function VideoPlayer({ src, captions = [], autoplay = false, poster = null, videoId = null }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Check if URL is a mock Cloudflare URL - MUST match StreamPage's detection exactly
  const isMockUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const urlLower = url.toLowerCase();
    return urlLower.includes('your-account.r2.cloudflarestorage.com') ||
           urlLower.includes('r2.cloudflarestorage.com') ||
           urlLower.includes('mock-cloudflare.example.com') ||
           (urlLower.includes('example.com') && !urlLower.includes('pub-')) ||
           urlLower.includes('test.cloudflare') ||
           (urlLower.includes('cloudflare.com/') && !urlLower.includes('pub-')) ||
           urlLower.includes('cloudflarestorage.com');
  };

  // NEVER use mock URLs - StreamPage should have converted them
  const safeSrc = src && isMockUrl(src) ? null : src;

  // Detect if URL is HLS stream
  const isHLSStream = (url) => {
    return url && (url.includes('.m3u8') || url.includes('application/vnd.apple.mpegurl'));
  };

  // Extract video ID from URL (e.g., /s/videoId or /stream/videoId)
  const extractVideoIdFromUrl = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      // Check for /s/:slug or /stream/:videoId patterns
      if (pathParts[0] === 's' && pathParts[1]) {
        return pathParts[1];
      }
      if (pathParts[0] === 'stream' && pathParts[1]) {
        return pathParts[1];
      }
      // Try to extract from any path segment
      return pathParts[pathParts.length - 1] || null;
    } catch {
      // If URL parsing fails, try regex
      const match = url.match(/\/(?:s|stream)\/([^\/\?]+)/);
      return match ? match[1] : null;
    }
  };

  useEffect(() => {
    // Safety check: don't initialize if no valid source
    if (!src || !safeSrc) {
      setLoading(false);
      if (!src) {
        setError({ message: 'No video source provided' });
      } else if (isMockUrl(src)) {
        setError({ message: 'Invalid video URL. Please contact support.' });
      }
      return;
    }

    // Don't initialize if container ref is not ready
    if (!containerRef.current) {
      return;
    }

    // Initialize Video.js player
    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
    videoElement.setAttribute('controls', '');
    videoElement.setAttribute('preload', 'auto');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('controlsList', 'nodownload');
    videoElement.disablePictureInPicture = true;
    
    if (poster) {
      videoElement.setAttribute('poster', poster);
    }

    // Clear container and add video element
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(videoElement);

    // Initialize Video.js with YouTube-like features
    const player = videojs(videoElement, {
      fluid: false,
      responsive: false,
      controls: true,
      preload: 'auto',
      autoplay: autoplay,
      playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], // More playback speed options
      liveui: true, // Enable live UI for live streams
      // YouTube-like control bar layout - properly arranged controls
      controlBar: {
        children: [
          'playToggle', // Play/Pause button (automatically toggles)
          'volumePanel', // Volume control
          'currentTimeDisplay', // Current time
          'timeDivider', // Time separator "/"
          'durationDisplay', // Total duration
          'progressControl', // Progress bar
          'liveDisplay',
          'remainingTimeDisplay',
          'spacer', // Flexible spacer to push controls to right
          'playbackRateMenuButton', // Playback speed (hidden by default, shown when clicked)
          'pictureInPictureToggle', // Picture-in-Picture
          'fullscreenToggle' // Fullscreen
          // Removed: 'subsCapsButton' (Closed Captions - not needed)
        ]
      },
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          handleManifestRedirects: true
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false
      },
      // YouTube-like settings - keep controls visible
      inactivityTimeout: 0, // Never hide controls (0 = always visible)
      userActions: {
        hotkeys: true // Enable hotkeys
      }
    }, () => {
      // Callback after player is ready
      console.log('Video.js initialized');
    });

    playerRef.current = player;
    setLoading(true);
    setError(null);

    // Set video source with cache-busting to ensure new videos load after replacement
    // Always add timestamp to URL to force browser to fetch new version
    let videoSrc = safeSrc;
    if (videoSrc) {
      try {
        // Parse URL and add/update cache-busting parameter
        const url = new URL(videoSrc);
        url.searchParams.set('t', Date.now().toString()); // Always update timestamp
        videoSrc = url.toString();
      } catch (e) {
        // If URL parsing fails (relative URL), append query parameter
        const separator = videoSrc.includes('?') ? '&' : '?';
        videoSrc = `${videoSrc}${separator}t=${Date.now()}`;
      }
    }
    
    const sourceType = isHLSStream(safeSrc) ? 'application/x-mpegURL' : 'video/mp4';
    
    // Always set source and load to ensure new videos play after replacement
    console.log('[VideoPlayer] Setting video source:', videoSrc);
    player.src({
      src: videoSrc,
      type: sourceType
    });
    
    // Force reload to ensure new video is loaded (important after replacement)
    player.load();

    // Add captions
    if (captions && captions.length > 0) {
      captions.forEach((caption, index) => {
        player.addRemoteTextTrack({
          kind: 'captions',
          src: caption.url,
          srclang: caption.language || 'en',
          label: caption.label || caption.language || 'English',
          default: index === 0
        }, false);
      });
    }

    // Event handlers
    player.ready(() => {
      console.log('Video.js player ready');
      setLoading(false);

      // Make sure player fills container
      const playerEl = player.el();
      if (playerEl) {
        playerEl.style.position = 'absolute';
        playerEl.style.top = '0';
        playerEl.style.left = '0';
        playerEl.style.width = '100%';
        playerEl.style.height = '100%';
        playerEl.style.objectFit = 'contain';
      }

      // Fix Big Play Button - ensure it works
     

      // Ensure video element also fills and configure security
      const videoEl = player.el().querySelector('video');
      if (videoEl) {
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'contain';
        
        // Disable right-click on video element
        videoEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          return false;
        });

        // Note: We keep PiP button visible but disable the actual PiP functionality
        // This matches YouTube's behavior where the button is visible but may be disabled
        if (videoEl.disablePictureInPicture !== undefined) {
          videoEl.disablePictureInPicture = true;
        }

        // Remove download attribute
        videoEl.removeAttribute('download');
        videoEl.setAttribute('controlsList', 'nodownload noplaybackrate');
      }

      // Ensure all control buttons are visible and properly styled
      const controlBar = player.controlBar;
      if (controlBar) {
        // Ensure play/pause toggle is visible and working
        const playToggle = controlBar.getChild('playToggle');
        if (playToggle) {
          playToggle.show();
          
          // Ensure play/pause button is clickable and works
          const playBtn = playToggle.el();
          if (playBtn) {
            playBtn.style.pointerEvents = 'auto';
            playBtn.style.cursor = 'pointer';
            playBtn.style.display = 'flex';
            playBtn.style.visibility = 'visible';
            
            // Add explicit click handler to ensure it works
            playBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              try {
                if (player.paused()) {
                  player.play().catch(err => {
                    console.error('Play error:', err);
                  });
                } else {
                  player.pause();
                }
              } catch (err) {
                console.error('Play/Pause error:', err);
              }
            });
          }
          
          // Ensure play/pause button toggles correctly on state change
          player.on('play', () => {
            const playBtn = playToggle.el();
            if (playBtn) {
              playBtn.classList.remove('vjs-paused');
              playBtn.classList.add('vjs-playing');
            }
            // Hide big play button when playing
            const bigPlayBtn = player.getChild('bigPlayButton');
            if (bigPlayBtn) {
              bigPlayBtn.hide();
            }
          });
          player.on('pause', () => {
            const playBtn = playToggle.el();
            if (playBtn) {
              playBtn.classList.remove('vjs-playing');
              playBtn.classList.add('vjs-paused');
            }
            // Show big play button when paused
            const bigPlayBtn = player.getChild('bigPlayButton');
            if (bigPlayBtn) {
              bigPlayBtn.show();
            }
          });
        }

        // Add playback rate button dynamically - show it and make it functional
        const playbackRateBtn = controlBar.getChild('playbackRateMenuButton');
        if (playbackRateBtn) {
          // Show the button (it will be visible)
          playbackRateBtn.show();
          
          // Ensure it's clickable and functional
          const playbackRateEl = playbackRateBtn.el();
          if (playbackRateEl) {
            playbackRateEl.style.pointerEvents = 'auto';
            playbackRateEl.style.cursor = 'pointer';
            playbackRateEl.style.display = 'flex';
            playbackRateEl.style.visibility = 'visible';
            
            // Get all control bar children to hide/show them
            const allControls = [
              controlBar.getChild('playToggle'),
              controlBar.getChild('volumePanel'),
              controlBar.getChild('currentTimeDisplay'),
              controlBar.getChild('timeDivider'),
              controlBar.getChild('durationDisplay'),
              controlBar.getChild('progressControl'),
              controlBar.getChild('liveDisplay'),
              controlBar.getChild('remainingTimeDisplay'),
              controlBar.getChild('pictureInPictureToggle'),
              controlBar.getChild('fullscreenToggle')
            ].filter(Boolean); // Remove null/undefined
            
            // Function to hide all controls except speed button
            const hideAllControls = () => {
              console.log('[Speed Button] hideAllControls called, hiding', allControls.length, 'controls');
              let hiddenCount = 0;
              allControls.forEach((control, index) => {
                if (control) {
                  try {
                    control.hide();
                    hiddenCount++;
                    const controlEl = control.el();
                    if (controlEl) {
                      controlEl.style.display = 'none';
                      controlEl.style.visibility = 'hidden';
                    }
                  } catch (err) {
                    console.error('[Speed Button] Error hiding control', index, err);
                  }
                }
              });
              console.log('[Speed Button] Hidden', hiddenCount, 'controls');
            };
            
            // Function to show all controls
            const showAllControls = () => {
              console.log('[Speed Button] showAllControls called, showing', allControls.length, 'controls');
              let shownCount = 0;
              allControls.forEach((control, index) => {
                if (control) {
                  try {
                    control.show();
                    shownCount++;
                    const controlEl = control.el();
                    if (controlEl) {
                      controlEl.style.display = '';
                      controlEl.style.visibility = '';
                    }
                  } catch (err) {
                    console.error('[Speed Button] Error showing control', index, err);
                  }
                }
              });
              console.log('[Speed Button] Shown', shownCount, 'controls');
            };
            
            // Update selected speed display
            const updateSpeedDisplay = (speed) => {
              const speedText = speed === 1 ? '1x' : `${speed}x`;
              playbackRateEl.setAttribute('data-selected-speed', speedText);
            };
            
            // Initialize with current playback rate
            updateSpeedDisplay(player.playbackRate());
            
            // Listen for playback rate changes
            player.on('ratechange', () => {
              updateSpeedDisplay(player.playbackRate());
            });
            
            // Diagnostic logging
            console.log('[Speed Button] Initializing speed button controls');
            console.log('[Speed Button] Found controls:', allControls.length);
            console.log('[Speed Button] Playback rate button:', playbackRateBtn);
            
            // Use MutationObserver to watch for class changes on the button
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                  const isMenuOpen = playbackRateEl.classList.contains('vjs-menu-button-open');
                  console.log('[Speed Button] Menu state changed:', isMenuOpen ? 'OPEN' : 'CLOSED');
                  
                  if (isMenuOpen) {
                    console.log('[Speed Button] Hiding all controls');
                    hideAllControls();
                  } else {
                    console.log('[Speed Button] Showing all controls');
                    showAllControls();
                    updateSpeedDisplay(player.playbackRate());
                  }
                }
              });
            });
            
            // Start observing the button element for class changes
            observer.observe(playbackRateEl, {
              attributes: true,
              attributeFilter: ['class']
            });
            
            // Ensure menu works
            const menu = playbackRateBtn.getChild('menu');
            if (menu) {
              console.log('[Speed Button] Menu found:', menu);
              
              // When menu opens, hide all other controls
              menu.on('show', () => {
                console.log('[Speed Button] Menu show event fired');
                playbackRateBtn.show();
                hideAllControls();
              });
              
              // When menu closes, show all controls again
              menu.on('hide', () => {
                console.log('[Speed Button] Menu hide event fired');
                showAllControls();
                updateSpeedDisplay(player.playbackRate());
              });
              
              // Listen for speed selection
              menu.on('change', () => {
                console.log('[Speed Button] Menu change event fired');
                setTimeout(() => {
                  showAllControls();
                  updateSpeedDisplay(player.playbackRate());
                }, 100);
              });
              
              // Listen to menu items being clicked
              const menuContent = menu.getChild('menuContent');
              if (menuContent) {
                console.log('[Speed Button] Menu content found');
                menuContent.on('click', (e) => {
                  console.log('[Speed Button] Menu item clicked');
                  setTimeout(() => {
                    showAllControls();
                    updateSpeedDisplay(player.playbackRate());
                  }, 100);
                });
              } else {
                console.warn('[Speed Button] Menu content not found');
              }
            } else {
              console.warn('[Speed Button] Menu not found');
            }
            
            // Also listen to button click to handle menu toggle
            playbackRateBtn.on('click', () => {
              console.log('[Speed Button] Button clicked');
              // Use a small delay to let Video.js update the class
              setTimeout(() => {
                const isMenuOpen = playbackRateEl.classList.contains('vjs-menu-button-open');
                console.log('[Speed Button] Menu open state after click:', isMenuOpen);
                if (isMenuOpen) {
                  hideAllControls();
                } else {
                  showAllControls();
                }
              }, 100);
            });
            
            // Listen for clicks outside to close menu and show controls
            const handleDocumentClick = (e) => {
              if (playbackRateEl && !playbackRateEl.contains(e.target)) {
                const isMenuOpen = playbackRateEl.classList.contains('vjs-menu-button-open');
                if (isMenuOpen) {
                  console.log('[Speed Button] Click outside detected, menu will close');
                  setTimeout(() => {
                    showAllControls();
                  }, 100);
                }
              }
            };
            document.addEventListener('click', handleDocumentClick);
            
            // Cleanup on player dispose
            player.on('dispose', () => {
              console.log('[Speed Button] Cleaning up');
              observer.disconnect();
              document.removeEventListener('click', handleDocumentClick);
            });
            
            // Also listen for rate changes to update display
            player.on('ratechange', () => {
              console.log('[Speed Button] Rate changed to:', player.playbackRate());
              updateSpeedDisplay(player.playbackRate());
            });
          }
        } else {
          // If button doesn't exist, create it dynamically
          try {
            const PlaybackRateMenuButton = videojs.getComponent('PlaybackRateMenuButton');
            if (PlaybackRateMenuButton) {
              const newPlaybackRateBtn = new PlaybackRateMenuButton(player, {
                playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
              });
              controlBar.addChild(newPlaybackRateBtn, {}, 6); // Add at position 6
              newPlaybackRateBtn.show();
            }
          } catch (err) {
            console.warn('Could not add playback rate button dynamically:', err);
          }
        }

        // Remove captions button completely (not in controlBar children anymore)
        const captionsBtn = controlBar.getChild('subsCapsButton');
        if (captionsBtn) {
          captionsBtn.hide();
        }

        // Show Picture-in-Picture button (even if disabled)
        const pipBtn = controlBar.getChild('pictureInPictureToggle');
        if (pipBtn) {
          pipBtn.show();
          // Disable PiP functionality but keep button visible (YouTube style)
          // The button will be visible but clicking won't do anything
          const pipButtonEl = pipBtn.el();
          if (pipButtonEl) {
            pipButtonEl.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              // Show message that PiP is disabled
              console.log('Picture-in-Picture is disabled for security');
            });
          }
        }

        // Show fullscreen button
        const fullscreenBtn = controlBar.getChild('fullscreenToggle');
        if (fullscreenBtn) {
          fullscreenBtn.show();
        }

        // Ensure time displays are visible
        const currentTime = controlBar.getChild('currentTimeDisplay');
        const duration = controlBar.getChild('durationDisplay');
        const timeDivider = controlBar.getChild('timeDivider');
        if (currentTime) currentTime.show();
        if (duration) duration.show();
        if (timeDivider) timeDivider.show();

        // Ensure volume panel is visible and working
        const volumePanel = controlBar.getChild('volumePanel');
        if (volumePanel) {
          volumePanel.show();
          
          // Ensure volume controls are clickable
          const volumeEl = volumePanel.el();
          if (volumeEl) {
            volumeEl.style.pointerEvents = 'auto';
            volumeEl.style.cursor = 'pointer';
            
            // Get volume button and slider
            const volumeButton = volumePanel.getChild('volumeControl');
            if (volumeButton) {
              const volumeBtnEl = volumeButton.el();
              if (volumeBtnEl) {
                volumeBtnEl.style.pointerEvents = 'auto';
                volumeBtnEl.style.cursor = 'pointer';
              }
            }
          }
        }
      }

      // YouTube-like keyboard shortcuts
      const handleKeyDown = (e) => {
        // Prevent download shortcuts
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          return;
        }

        // Only handle shortcuts when video player is focused or video is playing
        const isPlayerFocused = document.activeElement === player.el() || 
                               player.el().contains(document.activeElement) ||
                               !document.activeElement || 
                               document.activeElement.tagName === 'BODY';

        if (!isPlayerFocused && !player.paused()) {
          // Allow shortcuts even if not focused when video is playing
        } else if (!isPlayerFocused) {
          return; // Don't handle shortcuts if player is not focused
        }

        // Space bar: Play/Pause
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          if (player.paused()) {
            player.play();
          } else {
            player.pause();
          }
        }
        // Arrow Left: Rewind 10 seconds
        else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          player.currentTime(Math.max(0, player.currentTime() - 10));
        }
        // Arrow Right: Forward 10 seconds
        else if (e.key === 'ArrowRight') {
          e.preventDefault();
          player.currentTime(Math.min(player.duration(), player.currentTime() + 10));
        }
        // Arrow Up: Increase volume
        else if (e.key === 'ArrowUp') {
          e.preventDefault();
          player.volume(Math.min(1, player.volume() + 0.1));
        }
        // Arrow Down: Decrease volume
        else if (e.key === 'ArrowDown') {
          e.preventDefault();
          player.volume(Math.max(0, player.volume() - 0.1));
        }
        // M key: Mute/Unmute
        else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          player.muted(!player.muted());
        }
        // F key: Fullscreen
        else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          if (player.isFullscreen()) {
            player.exitFullscreen();
          } else {
            player.requestFullscreen();
          }
        }
        // K key: Play/Pause (YouTube style)
        else if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          if (player.paused()) {
            player.play();
          } else {
            player.pause();
          }
        }
        // Number keys 0-9: Jump to percentage (0=0%, 1=10%, ..., 9=90%)
        else if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          const percentage = parseInt(e.key) / 10;
          if (player.duration()) {
            player.currentTime(player.duration() * percentage);
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      // Store handler for cleanup
      player._keydownHandler = handleKeyDown;
    });

    // Enable quality selector after source is loaded (for HLS streams)
    player.on('loadedmetadata', () => {
      if (isHLSStream(safeSrc) && player.qualityLevels && player.qualityLevels().length > 0) {
        try {
          if (typeof player.hlsQualitySelector === 'function') {
            player.hlsQualitySelector({
              displayCurrentQuality: true,
              placementIndex: 1
            });
            console.log('HLS quality selector enabled');
          }
        } catch (err) {
          console.warn('Could not enable quality selector:', err);
        }
      }
    });

    player.on('loadstart', () => {
      console.log('Video: Load started');
      setLoading(true);
    });

    player.on('loadedmetadata', () => {
      console.log('Video: Metadata loaded');
      setLoading(false);
    });

    player.on('canplay', () => {
      console.log('Video: Can start playing');
      setLoading(false);
    });

    player.on('waiting', () => {
      console.log('Video: Buffering...');
      setLoading(true);
    });

    player.on('playing', () => {
      console.log('Video: Playing');
      setLoading(false);
    });

    // YouTube-like features: Show time on hover over progress bar
    player.on('loadedmetadata', () => {
      const progressControl = player.controlBar.getChild('progressControl');
      if (progressControl) {
        const seekBar = progressControl.getChild('seekBar');
        if (seekBar) {
          const seekBarEl = seekBar.el();
          if (seekBarEl) {
            // Add tooltip for time preview
            seekBarEl.addEventListener('mousemove', (e) => {
              const rect = seekBarEl.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              const time = percent * player.duration();
              
              // Create or update tooltip
              let tooltip = seekBarEl.querySelector('.vjs-time-tooltip');
              if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'vjs-time-tooltip';
                tooltip.style.cssText = `
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(0, 0, 0, 0.8);
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  white-space: nowrap;
                  pointer-events: none;
                  margin-bottom: 8px;
                  z-index: 1000;
                `;
                seekBarEl.style.position = 'relative';
                seekBarEl.appendChild(tooltip);
              }
              
              const minutes = Math.floor(time / 60);
              const seconds = Math.floor(time % 60);
              tooltip.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              tooltip.style.left = `${percent * 100}%`;
              tooltip.style.display = 'block';
            });
            
            seekBarEl.addEventListener('mouseleave', () => {
              const tooltip = seekBarEl.querySelector('.vjs-time-tooltip');
              if (tooltip) {
                tooltip.style.display = 'none';
              }
            });
          }
        }
      }
    });

    player.on('error', () => {
      const playerError = player.error();
      console.error('Video.js error:', playerError);
      
      let errorMessage = 'Failed to load video';
      if (playerError) {
        switch (playerError.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = 'Video loading aborted';
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = 'Network error while loading video. The video URL may be inaccessible or the server may be down.';
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = 'Video decoding error. The video file may be corrupted.';
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            if (safeSrc && (safeSrc.includes('localhost') || safeSrc.includes('127.0.0.1'))) {
              errorMessage = 'Video format not supported or file may be missing. Please check if the video file exists on the server.';
            } else {
              errorMessage = 'Video format not supported. The video file may be missing or corrupted.';
            }
            break;
          default:
            errorMessage = `Video error (code: ${playerError.code})`;
        }
      }
      
      setError({ message: errorMessage });
      setLoading(false);
    });

    // Cleanup function
    return () => {
      if (playerRef.current) {
        // Remove keydown handler
        if (playerRef.current._keydownHandler) {
          document.removeEventListener('keydown', playerRef.current._keydownHandler);
        }
        
        // Dispose Video.js player
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, safeSrc, captions, autoplay, poster]);

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
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !(src && isMockUrl(src)) && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center max-w-md p-4">
            <p className="font-bold mb-2 text-lg text-white">Video Error</p>
            <p className="text-sm text-white mb-4">{error.message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  if (playerRef.current) {
                    playerRef.current.load();
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setShowDiagnostic(true)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm text-white transition-colors flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Diagnose
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Modal */}
      {showDiagnostic && (
        <VideoDiagnostic
          videoId={videoId || (src ? extractVideoIdFromUrl(src) : null)}
          streamUrl={src}
          onClose={() => setShowDiagnostic(false)}
        />
      )}

      {/* Video.js container with 16:9 aspect ratio - compact size */}
      <div 
        ref={containerRef}
        className="w-full relative"
        style={{ 
          paddingTop: '56.25%',
          maxWidth: '900px',
          maxHeight: '400px',
          margin: '0 auto'
        }}
      />
    </div>
  );
}

export default VideoPlayer;
