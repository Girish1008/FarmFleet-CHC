import { Router } from 'express';
import { AiController } from '../controllers/aiController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyJwt, requireRole('CHC_MANAGER', 'ADMIN'));

router.post('/predict-duration', AiController.predictDuration);

export default router;
