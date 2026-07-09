const express = require('express');
const router = express.Router();
const { scanMedicineLabel } = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Handle medicine label scanning. Expects an 'image' file input field.
router.post('/', protect, upload.single('image'), scanMedicineLabel);

module.exports = router;
