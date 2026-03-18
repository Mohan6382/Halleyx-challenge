const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const DashboardConfig = require('../models/DashboardConfig');

// --- Orders API ---

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create an order
router.post('/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update an order
router.put('/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an order
router.delete('/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard Config API ---

// Get the latest dashboard config
router.get('/dashboard-config', async (req, res) => {
  try {
    const config = await DashboardConfig.findOne().sort({ createdAt: -1 });
    res.json(config || { widgets: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save new dashboard config
router.post('/dashboard-config', async (req, res) => {
  try {
    const newConfig = new DashboardConfig({ widgets: req.body.widgets });
    const savedConfig = await newConfig.save();
    res.status(201).json(savedConfig);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
