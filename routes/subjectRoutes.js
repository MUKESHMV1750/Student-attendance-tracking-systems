const express = require('express');
const router = express.Router();
const { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getSubjects);
router.get('/:id', protect, getSubject);
router.post('/', protect, staffOnly, createSubject);
router.put('/:id', protect, staffOnly, updateSubject);
router.delete('/:id', protect, staffOnly, deleteSubject);

module.exports = router;
