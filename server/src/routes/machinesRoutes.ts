import { Router } from 'express';
import { MachinesController } from '../controllers/machinesController.js';
import { verifyJwt, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', MachinesController.list);
router.post('/', verifyJwt, requireRole('ADMIN'), MachinesController.create);
router.patch('/:id', verifyJwt, requireRole('ADMIN', 'CHC_MANAGER'), MachinesController.update);

export default router;
