const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { listCheckInLogs } = require('../controllers/checkinLog.controller');
const { listCheckInLogsSchema } = require('../validators/checkinLog.validator');

const router = express.Router();

router.get('/', authenticate, authorize('super_admin', 'organizer', 'scanner_staff'), validate(listCheckInLogsSchema, 'query'), listCheckInLogs);

module.exports = router;
