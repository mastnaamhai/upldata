const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClientSchema = new Schema({
  name: { type: String, required: true },
  contactPerson: String,
  phone: { type: String, required: false },
  email: String,
  gstin: { type: String, required: true },
  address: String,
});

module.exports = mongoose.model('Client', ClientSchema);
