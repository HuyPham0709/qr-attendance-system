const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEventById,
  deleteEventById,
  getEventStats
} = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, authorize('organizer', 'super_admin'), getEvents);
router.post('/', authenticate, authorize('organizer', 'super_admin'), createEvent);
router.get('/:id', authenticate, authorize('organizer', 'super_admin'), getEventById);
router.patch('/:id', authenticate, authorize('organizer', 'super_admin'), updateEventById);
router.delete('/:id', authenticate, authorize('organizer', 'super_admin'), deleteEventById);
router.get('/:id/stats', authenticate, authorize('organizer', 'super_admin'), getEventStats);

module.exports = router;
