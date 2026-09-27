const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', authCtrl.login);
router.post('/bootstrap-superintendent', authCtrl.bootstrapSuperintendent);
router.get('/me', requireAuth, authCtrl.getMe);
router.post('/change-password', requireAuth, authCtrl.changePassword);

module.exports = router;
