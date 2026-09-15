import { Router } from 'express';
import * as controller from '../controllers/dailyQuestions.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/today', controller.getTodayQuestion);
router.post('/:id/answer', controller.answerQuestion);
router.get('/history/mine', controller.myAnswerHistory);
router.get('/shared/with-me', controller.sharedWithMe);

export default router;
