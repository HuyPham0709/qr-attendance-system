const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');

// Route quét mã QR
router.post('/scan', checkinController.scanCheckIn);

// Route check-in thủ công
router.post('/manual', checkinController.manualCheckIn);

// Route lấy lịch sử/nhật ký check-in
router.get('/logs', checkinController.getLogs);

module.exports = router;