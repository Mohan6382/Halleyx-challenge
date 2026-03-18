const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

// @route   GET api/dashboard
router.get('/', auth, dashboardController.getDashboardConfig);

// @route   POST api/dashboard/save
router.post(
  '/save',
  [
    auth,
    check('widgets', 'Widgets must be an array').optional().isArray()
  ],
  dashboardController.saveDashboardConfig
);

module.exports = router;
