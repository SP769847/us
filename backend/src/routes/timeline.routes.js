import { Router } from 'express';
import * as controller from '../controllers/timeline.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { makeUploader } from '../utils/upload.js';

const router = Router();
router.use(requireAuth);
const upload = makeUploader('timeline');

router.get('/', controller.listEvents);
router.post('/', upload.single('image'), controller.createEvent);
router.patch('/:id', upload.single('image'), controller.updateEvent);
router.delete('/:id', controller.deleteEvent);

export default router;
