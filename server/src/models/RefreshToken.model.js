const mongoose = require('mongoose');

/**
 * Mỗi document = 1 refresh token đã từng được cấp.
 *
 * - family: id cố định cho cả 1 phiên đăng nhập (không đổi khi rotate).
 *   Dùng để revoke hàng loạt khi phát hiện token bị đánh cắp và tái sử dụng.
 * - tokenHash: KHÔNG lưu refresh token thật, chỉ lưu SHA-256 hash của jti bên trong token.
 *   Nếu DB bị lộ, kẻ tấn công vẫn không có token dùng được trực tiếp.
 * - familyExpiresAt: trần tuyệt đối của cả family, không đổi khi rotate.
 *   Đảm bảo dù người dùng hoạt động liên tục (sliding session kiểu Facebook),
 *   vẫn phải đăng nhập lại sau khoảng thời gian tối đa này.
 * - expiresAt: hạn của riêng bản ghi này (trượt mỗi lần refresh, nhưng
 *   không bao giờ vượt quá familyExpiresAt).
 */
const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  family: { type: String, required: true, index: true },
  familyExpiresAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  replacedByHash: { type: String, default: null },
  createdByIp: String,
  userAgent: String
}, { timestamps: true });

// TTL index: MongoDB tự xoá document sau khi expiresAt qua -> không cần cron dọn rác riêng.
// An toàn để tự xoá vì sau khi hết hạn, bản ghi (dù revoked hay không) không còn giá trị tác vụ nào.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);