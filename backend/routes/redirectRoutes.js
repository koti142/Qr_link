import express from 'express';
import * as redirectController from '../controllers/redirectController.js';

const router = express.Router();

// Redirect route - must be simple to handle short URLs
router.get('/:slug', redirectController.handleRedirect);

export default router;

