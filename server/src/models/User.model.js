const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // select: false -> passwordHash không tự động trả về trong các query bình thường
  // (vd nếu sau này có API GET /users list), phải .select('+passwordHash') mới lấy được,
  // tránh lộ hash ra ngoài do quên .select('-passwordHash') ở đâu đó.
  passwordHash: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['super_admin', 'organizer', 'scanner_staff'],
    default: 'scanner_staff'
  },
  assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
}, { timestamps: true });

userSchema.methods.isLocked = function isLocked() {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

module.exports = mongoose.model('User', userSchema);