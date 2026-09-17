import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { otpLimiter } from '../middleware/rateLimiters.js';
import { makeUploader } from '../utils/upload.js';

const router = Router();
const uploadAvatar = makeUploader('avatars');

router.use(requireAuth);

router.get('/discover', usersController.discoverUsers);
router.get('/:username', usersController.getUserByUsername);
router.patch('/me/profile', uploadAvatar.single('avatar'), usersController.updateProfile);
router.post('/me/change-password', usersController.changePassword);
router.post('/me/whatsapp/send-otp', otpLimiter, usersController.sendWhatsappOtp);
router.post('/me/whatsapp/verify-otp', usersController.verifyWhatsappOtp);
router.post('/me/whatsapp/disable', usersController.disableWhatsapp);
router.post('/me/delete', usersController.deleteAccount);

export default router;
