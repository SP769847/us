import { Router } from 'express';
import * as controller from '../controllers/secretMessages.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', controller.listSecretMessages);
router.post('/', controller.createSecretMessage);
router.post('/:id/unlock', controller.unlockSecretMessage);

export default router;
