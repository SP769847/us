import { Router } from 'express';
import * as controller from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', controller.getStats);
router.get('/users', controller.listUsers);
router.post('/users/:id/suspend', controller.suspendUser);
router.post('/users/:id/unsuspend', controller.unsuspendUser);
router.get('/reports', controller.listReports);
router.post('/reports/:id/resolve', controller.resolveReport);

export default router;
