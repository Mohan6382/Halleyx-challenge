const CustomerOrder = require('../models/CustomerOrder');
const { validationResult } = require('express-validator');

exports.getOrders = async (req, res) => {
  try {
    const { dateFilter } = req.query;
    let query = {};

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last7':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last30':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last90':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          break; // treats as 'all' or no filter
      }

      if (dateFilter !== 'all') {
        query.createdAt = { $gte: startDate };
      }
    }

    const orders = await CustomerOrder.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array() });
  }

  try {
    const newOrder = new CustomerOrder({
      ...req.body
    });

    const order = await newOrder.save();
    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array() });
  }

  try {
    let order = await CustomerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    Object.assign(order, req.body);
    await order.save(); // Utilizing .save() properly triggers the pre('save') totalAmount recalculation

    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { confirm } = req.query;
    if (confirm !== 'true') {
      return res.status(400).json({ success: false, error: 'Confirmation flag (?confirm=true) is required to delete' });
    }

    const order = await CustomerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    await CustomerOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { msg: 'Order removed' } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
