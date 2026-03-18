const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postal: { type: String, required: true },
  country: { type: String, required: true },
  product: { type: String, required: true },
  qty: { type: Number, required: true },
  unitprice: { type: Number, required: true },
  total: { type: String },
  status: { type: String, required: true },
  createdby: { type: String, required: true },
  date: { type: String }
}, { timestamps: true });

OrderSchema.pre('save', function(next) {
  if (this.qty && this.unitprice) {
    this.total = '$' + (this.qty * this.unitprice).toFixed(2);
  }
  if (!this.date) {
    this.date = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
