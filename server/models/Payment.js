const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  date: { type: String, required: true },
  clientId: { type: String, required: true },
  amount: { type: Number, required: true },
  mode: { type: String, required: true },
  notes: String,
});

module.exports = mongoose.model('Payment', PaymentSchema);
