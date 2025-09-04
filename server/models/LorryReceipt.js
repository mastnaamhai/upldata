const mongoose = require('mongoose');
const { Schema } = mongoose;

const GoodsItemSchema = new Schema({
  productName: String,
  packagingType: String,
  packages: Number,
  actualWeight: Number,
  chargeWeight: Number,
}, { _id: true });


const FreightDetailsSchema = new Schema({
  basicFreight: Number,
  packingCharge: Number,
  pickupCharge: Number,
  serviceCharge: Number,
  loadingCharge: Number,
  codDodCharge: Number,
  haltingCharge: Number,
  extraCharge: Number,
  otherCharges: Number,
  sgstPercent: Number,
  cgstPercent: Number,
  advancePaid: Number,
}, { _id: false });

const LorryReceiptSchema = new Schema({
  lrNumber: { type: String, required: true },
  date: { type: String, required: true },
  from: String,
  to: String,
  consignorId: { type: String, required: true },
  consigneeId: { type: String, required: true },
  vehicleNumber: String,
  driverName: String,
  driverPhone: String,
  paymentStatus: String,
  transportMode: String,
  deliveryType: String,
  goods: [GoodsItemSchema],
  freightDetails: FreightDetailsSchema,
  gstPayableBy: String,
  otherRemark: String,
  bankName: String,
  bankAccountNo: String,
  bankIfsc: String,
  demurrageAfterHours: Number,
  demurrageChargePerHour: Number,
  receiverComments: String,
  status: { type: String, enum: ['Billed', 'Un-Billed'], default: 'Un-Billed' },
  isPickupDeliverySameAsPartyAddress: Boolean,
  loadingAddress: String,
  deliveryAddress: String,
  eWayBillNumber: String,
  sealNumber: String,
  isInsured: Boolean,
  insuranceDetails: String,
});

module.exports = mongoose.model('LorryReceipt', LorryReceiptSchema);
