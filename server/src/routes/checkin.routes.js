const express = require('express');
const { scanCheckIn, manualCheckIn } = require('../controllers/checkin.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/scan', authenticate, authorize('scanner_staff', 'organizer', 'super_admin'), scanCheckIn);
router.post('/manual', authenticate, authorize('organizer', 'scanner_staff', 'super_admin'), manualCheckIn);

module.exports = router;
