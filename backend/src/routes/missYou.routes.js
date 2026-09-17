import { Router } from 'express';
import { sendMissYou } from '../controllers/missYou.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', sendMissYou);

export default router;
