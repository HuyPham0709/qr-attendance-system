const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  name: { type: String, required: true },
  quantityLimit: { type: Number, default: null },
  price: { type: Number, default: 0 },
  allowedSessions: [String]
}, { timestamps: true });

module.exports = mongoose.model('TicketType', ticketTypeSchema);