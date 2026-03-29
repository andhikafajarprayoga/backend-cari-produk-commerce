const express = require('express');

const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/become-seller', requireAuth, authController.becomeSeller);

module.exports = router;
