const { Router } = require('express');
const { AuthController } = require('../controllers/AuthController.js');

const router = Router();

router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);
router.get('/register', AuthController.showRegister);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);

module.exports = router;
