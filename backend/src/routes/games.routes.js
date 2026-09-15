import { Router } from 'express';
import * as controller from '../controllers/games.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', controller.listGames);
router.post('/', controller.startGame);
router.get('/:id', controller.getGame);
router.post('/:id/answer', controller.answerGame);

export default router;
