import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.delete('/:id', messagesController.deleteMessage);
router.post('/:id/reactions', messagesController.toggleReaction);
router.post('/:id/pin', messagesController.togglePin);

export default router;
