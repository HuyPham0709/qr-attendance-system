// server/src/routes/ticketType.routes.js
//
// Router cho TicketType CRUD

const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createTicketTypeSchema, updateTicketTypeSchema } = require('../validators/ticketType.validator');
const {
  createTicketType,
  listTicketTypes,
  getTicketTypeById,
  updateTicketTypeById,
  deleteTicketTypeById
} = require('../controllers/ticketType.controller');

const router = express.Router();

// GET /api/ticket-types - public
router.get('/', listTicketTypes);

// GET /api/ticket-types/:id - public
router.get('/:id', getTicketTypeById);

// POST /api/ticket-types - chỉ organizer/super_admin
router.post(
  '/',
  authenticate,
  authorize('organizer', 'super_admin'),
  validate(createTicketTypeSchema),
  createTicketType
);

// PATCH /api/ticket-types/:id - chỉ organizer/super_admin
router.patch(
  '/:id',
  authenticate,
  authorize('organizer', 'super_admin'),
  validate(updateTicketTypeSchema),
  updateTicketTypeById
);

// DELETE /api/ticket-types/:id - chỉ organizer/super_admin
router.delete(
  '/:id',
  authenticate,
  authorize('organizer', 'super_admin'),
  deleteTicketTypeById
);

module.exports = router;
