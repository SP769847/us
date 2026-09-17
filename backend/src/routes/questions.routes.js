import { Router } from 'express';
import * as controller from '../controllers/questions.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/categories', controller.listCategories);
router.get('/random', controller.randomQuestion);
router.post('/send', controller.sendQuestion);
router.post('/:id/answer', controller.answerSentQuestion);
router.post('/:id/reveal', controller.revealSentQuestion);

export default router;
