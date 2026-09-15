const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { getOrganizerStats, getSystemStats, getCheckinsTimeline } = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/stats', authenticate, authorize('organizer'), getOrganizerStats);
router.get('/system-stats', authenticate, authorize('super_admin'), getSystemStats);
router.get('/checkins-timeline', authenticate, getCheckinsTimeline);

module.exports = router;
