const express = require('express');
const router = express.Router();
const { getTimetables, createTimetable, updateTimetable, deleteTimetable } = require('../controllers/timetableController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getTimetables);
router.post('/', protect, staffOnly, createTimetable);
router.put('/:id', protect, staffOnly, updateTimetable);
router.delete('/:id', protect, staffOnly, deleteTimetable);

module.exports = router;
