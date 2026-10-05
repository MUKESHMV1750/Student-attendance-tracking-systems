const express = require('express');
const router = express.Router();
const { getOverallReport, getDatewiseReport, exportReport, getAuditLog } = require('../controllers/reportController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

router.get('/overall', protect, staffOnly, getOverallReport);
router.get('/datewise', protect, staffOnly, getDatewiseReport);
router.get('/export', protect, staffOnly, exportReport);
router.get('/audit', protect, staffOnly, getAuditLog);

module.exports = router;
