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
  lockUntil: { type: Date, default: null },

  // --- 2FA (bắt buộc với super_admin — mục 1.1 spec) ---
  // twoFactorSecret: secret TOTP THẬT, chỉ tồn tại sau khi user đã xác
  // nhận setup thành công (confirm2FASetup). select:false vì đây là bí
  // mật dùng để sinh mã, tuyệt đối không được lộ ra response bình thường.
  twoFactorSecret: { type: String, select: false, default: null },
  twoFactorEnabled: { type: Boolean, default: false },
  // twoFactorTempSecret: secret TẠM sinh ra lúc bắt đầu flow setup (hiện
  // QR để quét), CHƯA có hiệu lực đăng nhập cho tới khi user nhập đúng 1
  // mã để xác nhận (confirm2FASetup) — tránh trường hợp secret bị treo
  // nếu user bỏ dở giữa chừng, hoặc bị người khác thấy QR trên màn hình.
  twoFactorTempSecret: { type: String, select: false, default: null }
}, { timestamps: true });

userSchema.methods.isLocked = function isLocked() {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

module.exports = mongoose.model('User', userSchema);