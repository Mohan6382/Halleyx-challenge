const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// GET /api/profile
router.get('/', auth, profileController.getProfile);

// PUT /api/profile
router.put('/', auth, profileController.updateProfile);

// DELETE /api/profile
router.delete('/', auth, profileController.deleteAccount);

module.exports = router;
