const express = require('express');
const router = express.Router();
const { getLocations, createLocation, updateLocation, deleteLocation } = require('../controllers/locationController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getLocations);
router.post('/', protect, staffOnly, createLocation);
router.put('/:id', protect, staffOnly, updateLocation);
router.delete('/:id', protect, staffOnly, deleteLocation);

module.exports = router;
