// server/src/routes/attendee.routes.js
//
// Router riêng cho các route /api/attendees/:id/...
// File này KHÔNG đụng vào route GET /api/attendees (danh sách) đang có sẵn
// trong app.js — mount song song, không xung đột.
//
// TODO (khi có auth.middleware.js + RBAC): thêm
//   router.get('/:id/qr', authenticate, authorize('scanner_staff', 'organizer', 'super_admin'), getAttendeeQr)
//   router.post('/:id/qr/revoke', authenticate, authorize('organizer', 'super_admin'), revokeAttendeeQr)
// Hiện tại 2 route đang để public tạm vì middleware auth chưa có trong repo —
// đừng deploy production ở trạng thái này.

const express = require('express');
const { getAttendeeQr, revokeAttendeeQr } = require('../controllers/qr.controller');

const router = express.Router();

router.get('/:id/qr', getAttendeeQr);
router.post('/:id/qr/revoke', revokeAttendeeQr);

module.exports = router;