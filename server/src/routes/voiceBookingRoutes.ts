import { Router } from 'express';
import multer from 'multer';
import { VoiceBookingController } from '../controllers/voiceBookingController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max audio
});

router.use(verifyJwt, requireRole('CHC_MANAGER', 'ADMIN'));

router.post('/process', upload.single('audio'), VoiceBookingController.process);
router.post('/confirm', VoiceBookingController.confirm);
router.post('/reject', VoiceBookingController.reject);

export default router;
