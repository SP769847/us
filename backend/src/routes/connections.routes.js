import { Router } from 'express';
import * as controller from '../controllers/connections.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', controller.listConnections);
router.post('/requests', controller.sendRequest);
router.get('/requests', controller.listPendingRequests);
router.post('/requests/:id/respond', controller.respondToRequest);
router.delete('/requests/:id', controller.cancelRequest);
router.delete('/:id', controller.removeConnection);

export default router;
