# HTML5 Video Player Setup Guide

## Overview

This application uses a custom HTML5 video player component that supports:
- **MP4/WebM videos** - Native HTML5 playback
- **HLS streams** (.m3u8) - Using hls.js library with native Safari fallback
- **Range requests** - For efficient seeking and partial content loading
- **Responsive design** - Works on all screen sizes
- **Error handling** - Comprehensive error messages and retry functionality

## Component: VideoPlayer.jsx

### Location
`frontend/src/components/VideoPlayer.jsx`

### Props

```javascript
<VideoPlayer
  src="http://localhost:5000/api/videos/videoId/stream"  // Required: Video URL
  captions={[]}                                           // Optional: Array of caption objects
  autoplay={false}                                        // Optional: Autoplay video
  poster="https://example.com/poster.jpg"                // Optional: Poster image URL
/>
```

### Caption Format

```javascript
const captions = [
  {
    language: 'en',
    url: 'https://example.com/captions/en.vtt',
    label: 'English'
  },
  {
    language: 'es',
    url: 'https://example.com/captions/es.vtt',
    label: 'Spanish'
  }
];
```

## Backend Streaming Route

### Current Route
`GET /api/videos/:videoId/stream`

### How It Works

1. **Route Handler**: `backend/routes/videoRoutes.js`
   - Handles GET, HEAD, and OPTIONS requests
   - Sets proper CORS headers
   - Routes to stream controller

2. **Stream Controller**: `backend/controllers/streamController.js`
   - Finds video file in storage (searches misc folder first)
   - Handles HTTP Range requests for seeking
   - Streams video in chunks using `fs.createReadStream`
   - Sets proper headers:
     - `Content-Type`: Video MIME type (video/mp4, video/webm, etc.)
     - `Content-Range`: Byte range for partial content
     - `Accept-Ranges`: bytes
     - `Content-Length`: Size of the chunk
     - CORS headers for cross-origin requests

### File Storage Location

Videos are stored in: `video-storage/` directory (relative to project root)

**Structure:**
```
video-storage/
├── misc/                          # Most videos are stored here
│   ├── VID_1764745515981_master.mp4
│   └── ...
└── [course]/[grade]/[lesson]/...  # Organized by metadata (if provided)
```

The stream controller automatically searches:
1. Misc folder (by filename or VID number)
2. Structured paths from database
3. Multiple fallback strategies

## Usage Examples

### Basic Usage

```javascript
import VideoPlayer from './components/VideoPlayer';

function MyVideoPage() {
  return (
    <div>
      <VideoPlayer 
        src="http://localhost:5000/api/videos/MyVideoId/stream"
      />
    </div>
  );
}
```

### With Captions

```javascript
<VideoPlayer
  src="http://localhost:5000/api/videos/MyVideoId/stream"
  captions={[
    { language: 'en', url: '/captions/en.vtt', label: 'English' },
    { language: 'es', url: '/captions/es.vtt', label: 'Spanish' }
  ]}
/>
```

### With Autoplay

```javascript
<VideoPlayer
  src="http://localhost:5000/api/videos/MyVideoId/stream"
  autoplay={true}
/>
```

### HLS Stream Example

```javascript
<VideoPlayer
  src="http://localhost:5000/api/videos/MyVideoId/stream.m3u8"
  // HLS is automatically detected and hls.js is loaded if needed
/>
```

## Features

### 1. Automatic Format Detection
- Detects HLS streams (.m3u8)
- Automatically loads hls.js for non-Safari browsers
- Uses native HLS support in Safari

### 2. Range Request Support
- Backend supports HTTP Range requests
- Enables seeking without downloading entire video
- Efficient bandwidth usage

### 3. Error Handling
- Network errors
- Format errors
- Decoding errors
- User-friendly error messages with retry button

### 4. Loading States
- Shows loading spinner while video loads
- Tracks buffering progress
- Displays metadata loading status

### 5. Responsive Design
- 16:9 aspect ratio container
- Full-width responsive layout
- Works on mobile, tablet, and desktop

## Browser Support

### MP4/WebM
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### HLS (.m3u8)
- ✅ Safari (native support)
- ✅ Chrome/Edge (via hls.js)
- ✅ Firefox (via hls.js)
- ✅ Mobile browsers (native on iOS, hls.js on Android)

## Dependencies

### Frontend
- `hls.js` - For HLS stream support in non-Safari browsers
- `react` - React framework
- `react-dom` - React DOM rendering

### Backend
- `express` - Web framework
- `fs` - File system operations (Node.js built-in)
- `path` - Path utilities (Node.js built-in)

## Troubleshooting

### Video Not Loading

1. **Check backend console**:
   - Look for "✓✓✓ FOUND IN MISC" or file path logs
   - Verify file exists at the logged path

2. **Check browser console**:
   - Look for CORS errors
   - Check network tab for failed requests
   - Verify response status (should be 206 for range requests)

3. **Check file path**:
   - Ensure video file exists in `video-storage/misc/` or structured path
   - Verify file permissions (readable)

### CORS Errors

- Backend already sets CORS headers
- Check that `Access-Control-Allow-Origin` header is present
- Verify OPTIONS preflight requests are handled

### Seeking Not Working

- Ensure backend returns `206 Partial Content` status
- Check `Content-Range` header is set correctly
- Verify `Accept-Ranges: bytes` header is present

### HLS Not Working

- Check browser console for hls.js errors
- Verify HLS stream URL is accessible
- Check network tab for failed segment requests

## Performance Optimization

1. **Preload Strategy**:
   - Currently set to `preload="metadata"` (loads only metadata)
   - Change to `preload="auto"` for faster playback start
   - Change to `preload="none"` to save bandwidth

2. **Buffering**:
   - HTML5 video handles buffering automatically
   - Backend streams in chunks for efficient delivery

3. **Caching**:
   - Backend sets `Cache-Control` headers
   - Browser caches video segments automatically

## Integration Steps

1. ✅ **Component Created**: `VideoPlayer.jsx` is ready
2. ✅ **Backend Route**: Streaming route is configured
3. ✅ **Dependencies**: hls.js is installed
4. ✅ **Usage**: Already integrated in `StreamPage.jsx` and `PublicVideoPage.jsx`

## Next Steps

The video player is now ready to use! Simply use the `<VideoPlayer>` component with a video URL:

```javascript
<VideoPlayer src="http://localhost:5000/api/videos/YourVideoId/stream" />
```

The backend will automatically:
- Find the video file
- Stream it with range request support
- Set proper headers for HTML5 video playback

## File Placement

Place video files in:
- **Primary location**: `video-storage/misc/` (recommended)
- **Organized location**: `video-storage/[course]/[grade]/[lesson]/...` (if metadata provided)

The stream controller will find files in either location automatically.

