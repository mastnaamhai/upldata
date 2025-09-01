const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExpenseSchema = new Schema({
  date: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  vehicleNumber: String,
});

module.exports = mongoose.model('Expense', ExpenseSchema);
