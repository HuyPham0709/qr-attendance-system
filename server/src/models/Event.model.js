const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  location: {
    address: String,
    geo: { lat: Number, lng: Number },
    geoFenceRadiusMeters: { type: Number, default: 200 }
  },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], default: 'draft' },
  gates: [{ name: String, code: String }],
  stats: {
    totalRegistered: { type: Number, default: 0 },
    totalCheckedIn: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);