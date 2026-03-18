const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/widgetController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

// @route   POST api/widgets/data
router.post(
  '/',
  [
    auth,
    check('metric', 'Metric field is required').not().isEmpty(),
    check('aggregation', 'Aggregation method is required').isIn(['sum', 'average', 'count']),
    check('dateFilter', 'Valid date filter is required').optional().isIn(['today', 'last7', 'last30', 'last90', 'all'])
  ],
  widgetController.getWidgetData
);

module.exports = router;
