import express from 'express';
import * as captionController from '../controllers/captionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:videoId', captionController.getCaptions);

// Protected admin routes
router.post('/', authenticateToken, captionController.uploadCaption);
router.delete('/:id', authenticateToken, captionController.deleteCaption);

export default router;

