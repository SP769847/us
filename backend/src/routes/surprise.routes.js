import { Router } from 'express';
import { surpriseMe } from '../controllers/surprise.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAuth, surpriseMe);

export default router;
