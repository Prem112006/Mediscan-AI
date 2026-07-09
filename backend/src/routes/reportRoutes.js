const express = require('express');
const router = express.Router();
const { analyzeReportFile } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Handle medical report analysis. Expects a 'file' input field (PDF or Image).
router.post('/', protect, upload.single('file'), analyzeReportFile);

module.exports = router;
