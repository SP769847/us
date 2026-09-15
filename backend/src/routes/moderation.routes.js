import { Router } from 'express';
import * as controller from '../controllers/moderation.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/block', controller.blockUser);
router.post('/unblock/:username', controller.unblockUser);
router.get('/blocked', controller.listBlockedUsers);
router.post('/reports', controller.reportUser);

export default router;
