const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getDashboardStats,
  getScanHistory,
  getReportHistory,
  deleteScanItem,
  deleteReportItem,
  clearAllHistory
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/dashboard', protect, getDashboardStats);
router.get('/scans', protect, getScanHistory);
router.get('/reports', protect, getReportHistory);
router.delete('/scans/:id', protect, deleteScanItem);
router.delete('/reports/:id', protect, deleteReportItem);
router.delete('/history/clear', protect, clearAllHistory);

module.exports = router;
