import { Router } from 'express';
import { OperatorController } from '../controllers/operatorController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyJwt);

router.get('/tasks', requireRole('OPERATOR', 'ADMIN', 'CHC_MANAGER'), OperatorController.getTasks);
router.patch('/tasks/:id', requireRole('OPERATOR', 'ADMIN', 'CHC_MANAGER'), OperatorController.updateTaskStatus);
router.get('/active-job', requireRole('OPERATOR', 'ADMIN', 'CHC_MANAGER'), OperatorController.getActiveJob);
router.post('/location', requireRole('OPERATOR'), OperatorController.recordLocation);

export default router;
