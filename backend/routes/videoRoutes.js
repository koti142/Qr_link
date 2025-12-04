import express from 'express';
import * as videoController from '../controllers/videoController.js';
import * as streamController from '../controllers/streamController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Log all requests to this router
router.use((req, res, next) => {
  console.log('[VideoRouter] Request received:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    params: req.params
  });
  next();
});

// Public routes
router.get('/', videoController.getAllVideos);
router.get('/filters', videoController.getFilterValues);

// Test endpoint to verify routing
router.get('/test-stream', (req, res) => {
  res.json({ message: 'Streaming route is accessible', timestamp: new Date().toISOString() });
});

// Simple streaming test endpoint
router.get('/test/:videoId/stream', async (req, res) => {
  console.log('[Test Route] Streaming test endpoint hit:', req.params.videoId);
  res.json({ 
    message: 'Streaming route is accessible',
    videoId: req.params.videoId,
    timestamp: new Date().toISOString(),
    path: req.path,
    url: req.url
  });
});

// Debug endpoint to list all routes
router.get('/debug/routes', (req, res) => {
  res.json({
    message: 'Video routes debug',
    routes: [
      'GET /api/videos/',
      'GET /api/videos/test-stream',
      'GET /api/videos/:videoId/stream',
      'GET /api/videos/:videoId',
      'POST /api/videos/upload (protected)',
      'PUT /api/videos/:id (protected)',
      'DELETE /api/videos/:id (protected)',
      'GET /api/videos/:videoId/versions (protected)'
    ]
  });
});

// Simple test endpoint that always works (to verify routing)
router.get('/:videoId/stream-test', (req, res) => {
  console.log('[Route] Stream test endpoint hit:', req.params.videoId);
  res.json({
    success: true,
    message: 'Streaming route is accessible',
    videoId: req.params.videoId,
    timestamp: new Date().toISOString()
  });
});

// Streaming route - MUST be before /:videoId to avoid route conflict
router.options('/:videoId/stream', (req, res) => {
  console.log('[Route] OPTIONS request for stream:', req.params.videoId);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.sendStatus(200);
});

router.get('/:videoId/stream', async (req, res, next) => {
  console.log('[Route] ===== STREAMING REQUEST RECEIVED =====');
  console.log('[Route] GET request for stream:', {
    videoId: req.params.videoId,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl
  });
  console.log('[Route] Headers:', {
    range: req.headers.range,
    'user-agent': req.headers['user-agent']
  });
  
  try {
    await streamController.streamVideo(req, res, next);
  } catch (error) {
    console.error('[Route] Error in stream controller:', error);
    console.error('[Route] Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Streaming error', 
        message: error.message,
        videoId: req.params.videoId
      });
    }
  }
});

router.get('/:videoId', videoController.getVideo);

// Protected admin routes
router.post('/upload', authenticateToken, videoController.uploadVideo);
router.put('/:id', authenticateToken, videoController.updateVideo);
router.delete('/:id', authenticateToken, videoController.deleteVideo);
router.get('/:videoId/versions', authenticateToken, videoController.getVideoVersions);

export default router;

