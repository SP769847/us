import { Router } from 'express';
import * as controller from '../controllers/specialDates.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', controller.listSpecialDates);
router.post('/', controller.createSpecialDate);
router.delete('/:id', controller.deleteSpecialDate);

export default router;
