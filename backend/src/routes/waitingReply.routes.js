import { Router } from 'express';
import * as controller from '../controllers/waitingReply.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/:conversationId', controller.getStatus);
router.post('/:conversationId/remind', controller.remind);

export default router;
