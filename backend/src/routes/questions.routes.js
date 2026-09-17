import { Router } from 'express';
import * as controller from '../controllers/questions.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/categories', controller.listCategories);
router.get('/preferences', controller.getPreferences);
router.patch('/preferences', controller.updatePreferences);
router.get('/random', controller.randomQuestion);
router.post('/send', controller.sendQuestion);
router.post('/:id/answer', controller.answerSentQuestion);
router.post('/:id/reveal', controller.revealSentQuestion);
router.post('/:id/skip', controller.skipSentQuestion);

router.get('/saved', controller.listSavedQuestions);
router.post('/saved', controller.saveQuestion);
router.delete('/saved/:id', controller.unsaveQuestion);

router.get('/custom', controller.listMyCustomQuestions);
router.post('/custom', controller.createCustomQuestion);
router.delete('/custom/:id', controller.deleteCustomQuestion);

export default router;
