const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

router.post('/login', authCtrl.login);
router.post('/register', authCtrl.register);
router.get('/me', authCtrl.getMe);
router.get('/demo-users', authCtrl.getDemoUsers);

module.exports = router;
