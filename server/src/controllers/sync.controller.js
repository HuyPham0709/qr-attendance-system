// server/src/controllers/sync.controller.js
//
// Endpoint mà Scanner PWA gọi khi có mạng lại, sau khi đã tích luỹ 1 hoặc
// nhiều lượt quét lúc offline (mục 2.2.B). Tách riêng khỏi checkin.controller.js
// vì đây là 1 luồng khác hẳn (nhận batch, ghi SyncQueue trước, xử lý sau) chứ
// không phải check-in 1 lượt trực tiếp như /scan và /manual.

const SyncQueue = require('../models/SyncQueue.model');
const { ok, fail } = require('../utils/apiResponse');
const { ensureEventAccess } = require('../middlewares/auth.middleware');
const { processPendingRecords } = require('../services/sync.service');

/**
 * POST /api/checkin/sync
 * Body (đã qua validate — syncBatchSchema): { eventId, gate?, deviceId?, records: [{ token, clientTimestamp? }] }
 * Role: scanner_staff, organizer, super_admin (gắn ở route, giống /scan và /manual)
 */
async function syncBatch(req, res, next) {
  try {
    const { eventId, gate, deviceId, records } = req.body;

    // Cùng 1 rule "chỉ thao tác được sự kiện được gán" (mục 1.3) với /scan
    // và /manual — không có lý do nào để endpoint đồng bộ được miễn check
    // này, vì bản chất vẫn là ghi check-in, chỉ khác nguồn dữ liệu đầu vào.
    if (!(await ensureEventAccess(req.user, eventId))) {
      return fail(
        res,
        403,
        'Bạn không được gán vào sự kiện này, không thể đồng bộ.',
        'EVENT_NOT_ASSIGNED'
      );
    }

    // Ghi vào SyncQueue TRƯỚC khi xử lý — nếu server crash/mất kết nối DB
    // giữa chừng lúc đang xử lý (bước dưới), dữ liệu quét offline vẫn còn
    // nguyên trong SyncQueue với status 'pending', không mất, và có thể xử
    // lý lại sau (vd cron/endpoint retry) mà không cần Scanner gửi lại từ
    // client — đây chính là lý do phải tách 2 bước "ghi" và "xử lý" thay vì
    // xử lý thẳng records trong request mà không lưu tạm.
    const docs = await SyncQueue.insertMany(
      records.map((r) => ({
        eventId,
        token: r.token,
        gate,
        deviceId,
        clientTimestamp: r.clientTimestamp
      }))
    );

    // Xử lý ngay trong cùng request — khối lượng thường vài trăm bản ghi/lần
    // nên không cần tách nền/queue riêng (xem giải thích trong sync.service.js).
    // Chỉ xử lý records 'pending' của ĐÚNG eventId này, nên nếu có job khác
    // đang xử lý event khác song song thì không đụng nhau.
    const summary = await processPendingRecords(eventId, { scannedBy: req.user?.id });

    return ok(res, { queued: docs.length, ...summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { syncBatch };
