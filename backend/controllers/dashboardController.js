const DashboardConfig = require('../models/DashboardConfig');
const { validationResult } = require('express-validator');

exports.getDashboardConfig = async (req, res) => {
  try {
    let config = await DashboardConfig.findOne({ userId: req.user.id });
    
    // If no config found for the user, return a default empty config or create one
    if (!config) {
      config = new DashboardConfig({
        userId: req.user.id,
        widgets: [],
        layout: {}
      });
      await config.save();
    }
    
    res.json({ success: true, data: config });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.saveDashboardConfig = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  const { widgets, layout } = req.body;

  try {
    let config = await DashboardConfig.findOne({ userId: req.user.id });

    if (config) {
      config.widgets = widgets || config.widgets;
      config.layout = layout || config.layout;
      await config.save();
      return res.json({ success: true, data: config });
    }

    config = new DashboardConfig({
      userId: req.user.id,
      widgets,
      layout
    });

    await config.save();
    res.json({ success: true, data: config });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
