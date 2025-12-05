import express from 'express';
import * as cloudflareController from '../controllers/cloudflareController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get misc files (for left side)
router.get('/misc-files', authenticateToken, cloudflareController.getMiscFiles);

// Get all My Storage resources
router.get('/resources', authenticateToken, cloudflareController.getMyStorageResources);

// Get videos with mock URLs
router.get('/videos-with-mock-urls', authenticateToken, cloudflareController.getVideosWithMockUrls);

// Get videos by streaming URL
router.get('/videos-by-url', authenticateToken, cloudflareController.getVideosByStreamingUrl);

// Upload to My Storage (my-storage folder)
router.post('/upload', authenticateToken, cloudflareController.uploadToMyStorage);

// Update My Storage resource
router.put('/resources/:id', authenticateToken, cloudflareController.updateMyStorageResource);

// Delete My Storage resource
router.delete('/resources/:id', authenticateToken, cloudflareController.deleteMyStorageResource);

export default router;

