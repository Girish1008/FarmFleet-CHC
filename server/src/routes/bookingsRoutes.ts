import { Router } from 'express';
import { BookingsController } from '../controllers/bookingsController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();

// All booking routes require authentication and CHC_MANAGER or ADMIN role
router.use(verifyJwt, requireRole('CHC_MANAGER', 'ADMIN'));

router.get('/', BookingsController.list);
router.post('/', BookingsController.create);
router.get('/:id', BookingsController.getById);
router.patch('/:id', BookingsController.update);
router.delete('/:id', BookingsController.delete);

export default router;
