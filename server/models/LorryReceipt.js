const mongoose = require('mongoose');
const { Schema } = mongoose;

const LorryReceiptSchema = new Schema({
  lr_number: { type: String, required: true, unique: true },

  // Phase 1: Booking
  consignor_name: { type: String, required: true },
  consignee_name: { type: String, required: true },
  goods_description: { type: String, required: true },
  quantity: { type: Number, required: true },
  weight: { type: Number, required: true },
  origin_location: { type: String, required: true },
  destination_location: { type: String, required: true },
  freight_type: { type: String, enum: ['Paid', 'Due'], required: true },
  freight_amount: { type: Number, required: true },
  hide_freight_in_pdf: { type: Boolean, default: false },
  booking_time: { type: Date, default: Date.now },

  // Phase 2: Dispatch
  vehicle_number: String,
  driver_name: String,
  dispatch_time: Date,

  // Phase 3: In Transit
  current_location: String,
  transit_updates: [{
    location: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Phase 4: Delivery
  proof_of_delivery: String, // Path to signature or image file
  delivery_time: Date,

  // Phase 5: Closure
  closure_time: Date,

  status: {
    type: String,
    enum: ['Booked', 'Dispatched', 'In Transit', 'Delivered', 'Closed'],
    default: 'Booked'
  },
});

module.exports = mongoose.model('LorryReceipt', LorryReceiptSchema);
