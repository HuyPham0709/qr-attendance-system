const mongoose = require('mongoose');

const checkInLogSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendee', required: true, index: true },
  result: { type: String, enum: ['success', 'duplicate', 'invalid_qr', 'expired_qr', 'wrong_geo', 'revoked'], required: true },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gate: String,
  deviceId: String,
  geo: { lat: Number, lng: Number },
  offlineSynced: { type: Boolean, default: false },
  clientTimestamp: Date,
  createdAt: { type: Date, default: Date.now }
});

checkInLogSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model('CheckInLog', checkInLogSchema);