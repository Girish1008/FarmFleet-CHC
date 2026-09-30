import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { verifyJwt } from '../middleware/auth.js';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', verifyJwt, AuthController.me);

export default router;
