import express from 'express';
import * as cloudflareController from '../controllers/cloudflareController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get misc files (for left side)
router.get('/misc-files', authenticateToken, cloudflareController.getMiscFiles);

// Get all Cloudflare resources
router.get('/resources', authenticateToken, cloudflareController.getCloudflareResources);

// Get videos with mock URLs
router.get('/videos-with-mock-urls', authenticateToken, cloudflareController.getVideosWithMockUrls);

// Get videos by Cloudflare URL
router.get('/videos-by-url', authenticateToken, cloudflareController.getVideosByCloudflareUrl);

// Upload to Cloudflare
router.post('/upload', authenticateToken, cloudflareController.uploadToCloudflare);

// Update Cloudflare resource
router.put('/resources/:id', authenticateToken, cloudflareController.updateCloudflareResource);

// Delete Cloudflare resource
router.delete('/resources/:id', authenticateToken, cloudflareController.deleteCloudflareResource);

export default router;

