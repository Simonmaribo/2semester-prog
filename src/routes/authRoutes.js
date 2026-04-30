import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);
router.get('/register', AuthController.showRegister);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);

export default router;
