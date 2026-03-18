const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema({
  widgetId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  posX: { type: Number, required: true },
  posY: { type: Number, required: true },
  config: { type: mongoose.Schema.Types.Mixed }
});

const dashboardConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  widgets: [widgetSchema],
  layout: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('DashboardConfig', dashboardConfigSchema);
