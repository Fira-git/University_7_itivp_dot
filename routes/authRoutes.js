const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { validateRegister } = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/authMiddleware');
// while posting /register, validate the request body first, then call register controller
router.post('/register', validateRegister, register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
module.exports = router;
