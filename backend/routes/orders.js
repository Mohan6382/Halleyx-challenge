const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

const validateOrder = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Include a valid email').isEmail(),
  check('phoneNumber', 'Phone number is required').not().isEmpty(),
  check('streetAddress', 'Street address is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('state', 'State is required').not().isEmpty(),
  check('postalCode', 'Postal code is required').not().isEmpty(),
  check('country', 'Country must be valid').isIn(['United States', 'Canada', 'Australia', 'Singapore', 'Hong Kong']),
  check('product', 'Product must be valid').isIn(['Fiber Internet 300 Mbps', '5G Unlimited Mobile Plan', 'Fiber Internet 1 Gbps', 'Business Internet 500 Mbps', 'VoIP Corporate Package']),
  check('quantity', 'Quantity must be numeric and at least 1').isInt({ min: 1 }),
  check('unitPrice', 'Unit price is required and must be numeric').isNumeric(),
  check('createdBy', 'CreatedBy must be valid').isIn(['Mr. Michael Harris', 'Mr. Ryan Cooper', 'Ms. Olivia Carter', 'Mr. Lucas Martin']),
  check('status', 'Status must be valid').optional().isIn(['Pending', 'In Progress', 'Completed'])
];

const validateOrderUpdate = [ ...validateOrder.map(validation => validation.optional({ checkFalsy: true })) ];

router.get('/', auth, orderController.getOrders);

router.post('/', [auth, validateOrder], orderController.createOrder);

router.put('/:id', [auth, validateOrderUpdate], orderController.updateOrder);

router.delete('/:id', auth, orderController.deleteOrder);

module.exports = router;
