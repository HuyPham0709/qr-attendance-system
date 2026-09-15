const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  banner: String,
  // --- Noi dung mo rong cho trang chi tiet/dat ve public (client-attendee) ---
  // Tat ca optional -> event cu (khong co field nay) van hoat dong binh
  // thuong, trang attendee tu an phan section tuong ung neu rong/thieu.
  gallery: { type: [String], default: [] }, // them anh su kien ngoai banner chinh
  highlights: { type: [String], default: [] }, // diem noi bat, hien thi dang the ngan
  agenda: {
    type: [{
      time: String, // vi du "09:00" hoac "09:00 - 09:30"
      title: { type: String, required: true },
      description: String
    }],
    default: []
  },
  organizerInfo: {
    name: String,
    logo: String,
    description: String
  },
  tags: { type: [String], default: [] }, // vi du "Cong nghe", "Mien phi", "Online"
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