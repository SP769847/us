import { Router } from 'express';
import * as conversationsController from '../controllers/conversations.controller.js';
import * as messagesController from '../controllers/messages.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { makeUploader } from '../utils/upload.js';

const router = Router();
router.use(requireAuth);
const uploadChatImage = makeUploader('chat');

router.get('/', conversationsController.listConversations);
router.get('/:id', conversationsController.getConversation);
router.post('/:id/read', conversationsController.markConversationRead);
router.get('/:id/search', conversationsController.searchConversationMessages);
router.get('/:id/pinned', conversationsController.listPinnedMessages);

router.get('/:id/messages', messagesController.listMessages);
router.post('/:id/messages', uploadChatImage.single('image'), messagesController.sendMessage);

export default router;
