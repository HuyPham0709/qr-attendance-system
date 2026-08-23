const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  name: { type: String, required: true },
  quantityLimit: { type: Number, default: null },
  // Số vé đã phát ra cho loại vé này (self-registration của Attendee +
  // Organizer tạo thủ công/import đều phải tăng field này). Bắt buộc để
  // enforce quantityLimit theo đúng cơ chế atomic của spec (mục 5.4):
  //   findOneAndUpdate({ _id, $expr: { $lt: ['$quantitySold','$quantityLimit'] } }, { $inc: { quantitySold: 1 } })
  // quantityLimit === null nghĩa là KHÔNG giới hạn -> bỏ qua điều kiện $expr.
  quantitySold: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  allowedSessions: [String]
}, { timestamps: true });

module.exports = mongoose.model('TicketType', ticketTypeSchema);