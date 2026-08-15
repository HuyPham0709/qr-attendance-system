const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: String,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'organizer', 'scanner_staff', 'viewer'],
    default: 'scanner_staff'
  },
  assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);