import express from 'express';
import * as redirectController from '../controllers/redirectController.js';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Redirect management
router.get('/redirects', redirectController.getAllRedirects);
router.post('/redirects', redirectController.createRedirect);
router.delete('/redirects/:slug', redirectController.deleteRedirect);

// User management
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

export default router;

