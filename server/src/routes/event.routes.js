// server/src/routes/event.routes.js
//
// Router cho Event CRUD

const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createEventSchema, updateEventSchema } = require('../validators/event.validator');
const {
  createEvent,
  listEvents,
  getEventById,
  updateEventById,
  deleteEventById
} = require('../controllers/event.controller');

const router = express.Router();

// GET /api/events - public (hoặc filter theo role nếu auth)
router.get('/', listEvents);

// GET /api/events/:id - public
router.get('/:id', getEventById);

// POST /api/events - chỉ organizer/super_admin
router.post(
  '/',
  authenticate,
  authorize('organizer', 'super_admin'),
  validate(createEventSchema),
  createEvent
);

// PATCH /api/events/:id - chỉ organizer/super_admin
router.patch(
  '/:id',
  authenticate,
  authorize('organizer', 'super_admin'),
  validate(updateEventSchema),
  updateEventById
);

// DELETE /api/events/:id - chỉ organizer/super_admin
router.delete(
  '/:id',
  authenticate,
  authorize('organizer', 'super_admin'),
  deleteEventById
);

module.exports = router;
