import { Router } from 'express';
import { TrackingController } from '../controllers/trackingController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyJwt, requireRole('CHC_MANAGER', 'ADMIN'));

router.get('/:bookingId', TrackingController.getBookingTracking);

export default router;
