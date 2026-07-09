const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyOTP,
  googleOAuthLogin,
  forgotPassword,
  getGoogleConfig
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/google-oauth', googleOAuthLogin);
router.post('/forgot-password', forgotPassword);
router.get('/google-config', getGoogleConfig);

module.exports = router;
