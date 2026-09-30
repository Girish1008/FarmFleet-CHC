import { Router } from 'express';
import { FarmerController } from '../controllers/farmerController.js';
import { verifyJwt } from '../middleware/auth.js';

const router = Router();

router.use(verifyJwt);

// Requests
router.get('/requests', FarmerController.listRequests);
router.post('/requests', FarmerController.createRequest);
router.get('/requests/:id', FarmerController.getRequestById);

// Bookings
router.get('/bookings', FarmerController.listBookings);
router.get('/bookings/:id', FarmerController.getBookingById);
router.post('/bookings/:id/cancel', FarmerController.cancelBooking);

// Notifications
router.get('/notifications', FarmerController.listNotifications);
router.patch('/notifications/:id/read', FarmerController.markNotificationRead);

export default router;
