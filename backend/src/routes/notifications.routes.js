import { Router } from 'express';
import * as controller from '../controllers/notifications.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', controller.listNotifications);
router.get('/unread-count', controller.unreadCount);
router.get('/preferences', controller.getPreferences);
router.patch('/preferences', controller.updatePreferences);
router.post('/:id/read', controller.markRead);
router.post('/read-all', controller.markAllRead);

export default router;
