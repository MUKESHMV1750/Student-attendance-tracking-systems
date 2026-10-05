const express = require('express');
const router = express.Router();
const {
  startSession, getActiveSessions, closeSession,
  markAttendanceQR, markAttendancePIN,
  getSessionAttendance, editAttendance,
  getMyAttendance, getSubjectWiseAttendance, getSessionQR,
  getManualClassRoster, manualMarkAttendance, bulkManualMarkAttendance
} = require('../controllers/attendanceController');
const { protect, staffOnly, studentOnly } = require('../middleware/authMiddleware');

// Staff routes
router.post('/session/start', protect, staffOnly, startSession);
router.get('/session/active', protect, staffOnly, getActiveSessions);
router.put('/session/:id/close', protect, staffOnly, closeSession);
router.get('/session/:id/qr', protect, staffOnly, getSessionQR);
router.get('/session/:sessionId/records', protect, staffOnly, getSessionAttendance);
router.put('/:id/edit', protect, staffOnly, editAttendance);
router.get('/manual-roster', protect, staffOnly, getManualClassRoster);
router.post('/manual-mark', protect, staffOnly, manualMarkAttendance);
router.post('/bulk-manual-mark', protect, staffOnly, bulkManualMarkAttendance);

// Student routes
router.post('/mark/qr', protect, studentOnly, markAttendanceQR);
router.post('/mark/pin', protect, studentOnly, markAttendancePIN);
router.get('/my', protect, studentOnly, getMyAttendance);
router.get('/my/subjects', protect, studentOnly, getSubjectWiseAttendance);

// Staff: view any student's subject-wise
router.get('/student/:studentId/subjects', protect, staffOnly, getSubjectWiseAttendance);

module.exports = router;
