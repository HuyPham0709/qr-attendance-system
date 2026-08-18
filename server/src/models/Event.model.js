const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  banner: String,
  location: {
    address: String,
    geo: { lat: Number, lng: Number },
    geoFenceRadiusMeters: { type: Number, default: 200 }
  },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], default: 'draft' },
  settings: {
    allowMultipleCheckIn: { type: Boolean, default: false },
    requireGeoFence: { type: Boolean, default: false },
    qrTokenTTLMinutes: { type: Number, default: 0 },
    checkInWindowMinutes: { type: Number, default: 60 }
  },
  gates: [{
    name: String,
    code: { type: String, unique: true, sparse: true }
  }],
  stats: {
    totalRegistered: { type: Number, default: 0 },
    totalCheckedIn: { type: Number, default: 0 }
  }
}, { timestamps: true });

eventSchema.index({ organizationId: 1, startAt: -1 });

module.exports = mongoose.model('Event', eventSchema);