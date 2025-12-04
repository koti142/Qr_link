import express from 'express';
import * as redirectController from '../controllers/redirectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin redirect routes
router.get('/redirects', redirectController.getAllRedirects);
router.delete('/redirects/:slug', redirectController.deleteRedirect);

export default router;





