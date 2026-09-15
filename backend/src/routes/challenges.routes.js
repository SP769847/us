import { Router } from 'express';
import * as controller from '../controllers/challenges.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/random', controller.getRandomChallenge);
router.get('/', controller.listChallenges);
router.post('/', controller.sendChallenge);
router.post('/:id/respond', controller.respondToChallenge);

export default router;
