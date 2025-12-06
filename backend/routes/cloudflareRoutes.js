import express from 'express';
import * as cloudflareController from '../controllers/cloudflareController.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectoryExists } from '../utils/fileUtils.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads from PC
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      // Store temporarily, will be moved to my-storage
      const tempDir = path.join(__dirname, '../../temp-uploads');
      await ensureDirectoryExists(tempDir);
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      // Use original filename with timestamp to avoid conflicts
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}_${timestamp}${ext}`);
    }
  }),
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

const router = express.Router();

// Get misc files (for left side)
router.get('/misc-files', authenticateToken, cloudflareController.getMiscFiles);

// Delete misc file
router.delete('/misc-files', authenticateToken, cloudflareController.deleteMiscFile);

// Get all My Storage resources
router.get('/resources', authenticateToken, cloudflareController.getMyStorageResources);

// Get videos with mock URLs
router.get('/videos-with-mock-urls', authenticateToken, cloudflareController.getVideosWithMockUrls);

// Get videos by streaming URL
router.get('/videos-by-url', authenticateToken, cloudflareController.getVideosByStreamingUrl);

// Upload to My Storage (my-storage folder)
// Handle both JSON (for misc files) and multipart/form-data (for PC uploads)
router.post('/upload', authenticateToken, upload.single('file'), cloudflareController.uploadToMyStorage);

// Update My Storage resource
router.put('/resources/:id', authenticateToken, cloudflareController.updateMyStorageResource);

// Delete My Storage resource
router.delete('/resources/:id', authenticateToken, cloudflareController.deleteMyStorageResource);

// Cleanup orphaned files (files in my-storage without database entries)
router.get('/cleanup-orphaned', authenticateToken, cloudflareController.cleanupOrphanedFiles);

export default router;

