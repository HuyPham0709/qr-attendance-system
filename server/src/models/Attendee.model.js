const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  qrCode: { type: String, unique: true, index: true },
  qrSecret: { type: String, select: false },
  qrVersion: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['registered', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
    default: 'registered',
    index: true
  },
  checkIn: {
    isCheckedIn: { type: Boolean, default: false },
    checkInAt: Date,
    checkInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gate: String,
    method: { type: String, enum: ['qr_scan', 'manual', 'kiosk'] },
    deviceInfo: String
  },
  version: { type: Number, default: 0 },
  customFields: mongoose.Schema.Types.Mixed
}, { timestamps: true });

attendeeSchema.index({ eventId: 1, email: 1 }, { unique: true });
attendeeSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('Attendee', attendeeSchema);