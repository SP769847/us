import { Router } from 'express';
import * as controller from '../controllers/memories.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { makeUploader } from '../utils/upload.js';

const router = Router();
router.use(requireAuth);
const upload = makeUploader('memories');

router.get('/', controller.listMemories);
router.post('/', upload.array('photos', 8), controller.createMemory);
router.get('/:id', controller.getMemory);
router.patch('/:id', upload.array('photos', 8), controller.updateMemory);
router.delete('/:id', controller.deleteMemory);

export default router;
