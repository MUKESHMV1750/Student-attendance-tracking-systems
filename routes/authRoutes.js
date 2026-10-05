const express = require('express');
const router = express.Router();
const { login, getMe, registerStaff, changePassword } = require('../controllers/authController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register-staff', protect, staffOnly, registerStaff);
router.put('/change-password', protect, changePassword);

module.exports = router;
