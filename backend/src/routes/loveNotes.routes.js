import { Router } from 'express';
import * as controller from '../controllers/loveNotes.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { makeUploader } from '../utils/upload.js';

const router = Router();
router.use(requireAuth);
const upload = makeUploader('love-notes');

router.get('/', controller.listLoveNotes);
router.post('/', upload.single('image'), controller.createLoveNote);
router.get('/:id', controller.getLoveNote);
router.delete('/:id', controller.deleteLoveNote);

export default router;
