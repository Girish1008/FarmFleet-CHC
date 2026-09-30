import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyJwt, requireRole('CHC_MANAGER', 'ADMIN'));

router.get('/', ScheduleController.getSchedule);
router.get('/recommend-slots', ScheduleController.recommendSlots);
router.get('/proposals', ScheduleController.listProposals);
router.post('/propose-reschedule', ScheduleController.proposeReschedule);
router.post('/accept-reschedule', ScheduleController.acceptReschedule);
router.post('/reject-reschedule', ScheduleController.rejectReschedule);

export default router;
