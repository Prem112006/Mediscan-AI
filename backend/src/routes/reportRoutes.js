const express = require('express');
const router = express.Router();
const { analyzeReportFile, translateReportData } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Handle medical report analysis. Expects a 'file' input field (PDF or Image).
router.post('/', protect, upload.single('file'), analyzeReportFile);

// Translate structured report JSON
router.post('/translate', protect, translateReportData);

module.exports = router;

