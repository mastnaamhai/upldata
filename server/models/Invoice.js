const mongoose = require('mongoose');
const { Schema } = mongoose;

const LrDetailSchema = new Schema({
  // Storing as raw data, not refs, as they are a snapshot in time for the invoice
  id: String, // original LR id
  lrNumber: String,
  date: String,
  truckNumber: String,
  from: String,
  to: String,
  materialDetails: String,
  articles: Number,
  totalWeight: Number,
  freightAmount: Number,
  haltingCharge: Number,
  extraCharge: Number,
  advance: Number,
}, { _id: true });


const BankDetailsSchema = new Schema({
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
}, { _id: false });

const InvoiceSchema = new Schema({
  id: { type: String, required: true, unique: true }, // This is the 'INV-001' style number
  date: { type: String, required: true },
  clientId: { type: String, required: true },
  lrDetails: [LrDetailSchema],
  discount: Number,
  gstRate: Number,
  tdsRate: Number,
  tdsDeduction: Number,
  advanceReceived: Number,
  advanceReceivedVia: String,
  roundOff: Number,
  hsnCode: String,
  remarks: String,
  bankDetails: BankDetailsSchema,
  gstPayableBy: String,
  subTotal: Number,
  totalTripAmount: Number,

  invoiceValue: Number,
  netPayable: Number,
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
