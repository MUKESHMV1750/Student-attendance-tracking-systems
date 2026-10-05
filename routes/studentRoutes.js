const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, importStudents, exportStudents } = require('../controllers/studentController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, staffOnly, getStudents);
router.get('/export', protect, staffOnly, exportStudents);
router.get('/:id', protect, staffOnly, getStudent);
router.post('/', protect, staffOnly, createStudent);
router.post('/import', protect, staffOnly, upload.single('file'), importStudents);
router.put('/:id', protect, staffOnly, updateStudent);
router.delete('/:id', protect, staffOnly, deleteStudent);

module.exports = router;
