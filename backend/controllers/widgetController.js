const CustomerOrder = require('../models/CustomerOrder');
const { validationResult } = require('express-validator');

// Map spec display-name fields → actual MongoDB schema field names
const METRIC_FIELD_MAP = {
  'Customer ID':   '_id',
  'Customer name': 'firstName',
  'Email id':      'email',
  'Address':       'streetAddress',
  'Order date':    'createdAt',
  'Product':       'product',
  'Created by':    'createdBy',
  'Status':        'status',
  'Total amount':  'totalAmount',
  'Unit price':    'unitPrice',
  'Quantity':      'quantity',
  // Legacy camelCase (passed directly from old config)
  'totalAmount':   'totalAmount',
  'unitPrice':     'unitPrice',
  'quantity':      'quantity',
};

// Non-numeric fields only support 'count' aggregation meaningfully
const NON_NUMERIC_FIELDS = new Set(['_id', 'firstName', 'email', 'streetAddress', 'createdAt', 'product', 'createdBy', 'status']);

exports.getWidgetData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array() });
  }

  const { metric, aggregation, dateFilter } = req.body;

  // Resolve the actual database field name
  const fieldName = METRIC_FIELD_MAP[metric] || metric;
  const aggMethod = (aggregation || 'sum').toLowerCase();

  try {
    let matchStage = {};

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
          break;
      }

      if (dateFilter !== 'all') {
        matchStage.createdAt = { $gte: startDate };
      }
    }

    // Determine aggregation
    let groupStage = { _id: null };

    if (aggMethod === 'sum') {
      // For non-numeric fields, fall back to count
      if (NON_NUMERIC_FIELDS.has(fieldName)) {
        groupStage.value = { $sum: 1 };
      } else {
        groupStage.value = { $sum: `$${fieldName}` };
      }
    } else if (aggMethod === 'average') {
      if (NON_NUMERIC_FIELDS.has(fieldName)) {
        groupStage.value = { $sum: 1 };
      } else {
        groupStage.value = { $avg: `$${fieldName}` };
      }
    } else if (aggMethod === 'count') {
      groupStage.value = { $sum: 1 };
    } else {
      return res.status(400).json({ success: false, error: 'Invalid aggregation method' });
    }

    const result = await CustomerOrder.aggregate([
      { $match: matchStage },
      { $group: groupStage }
    ]);

    const value = result.length > 0 ? result[0].value : 0;

    res.json({ success: true, data: { value } });
  } catch (err) {
    console.error('widgetController error:', err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
