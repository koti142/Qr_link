import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', authController.login);
router.get('/verify', authenticateToken, authController.verifyToken);

export default router;





