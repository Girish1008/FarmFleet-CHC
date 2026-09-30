import { Router } from 'express';
import { UsersController } from '../controllers/usersController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyJwt, requireRole('ADMIN', 'CHC_MANAGER'));

router.get('/', UsersController.list);
router.patch('/:id', requireRole('ADMIN'), UsersController.update);

export default router;
