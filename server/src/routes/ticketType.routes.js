const express = require('express');
const {
  createTicketType,
  getTicketTypes,
  getTicketTypeById,
  updateTicketTypeById,
  deleteTicketTypeById
} = require('../controllers/ticketType.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, authorize('organizer', 'super_admin'), getTicketTypes);
router.post('/', authenticate, authorize('organizer', 'super_admin'), createTicketType);
router.get('/:id', authenticate, authorize('organizer', 'super_admin'), getTicketTypeById);
router.patch('/:id', authenticate, authorize('organizer', 'super_admin'), updateTicketTypeById);
router.delete('/:id', authenticate, authorize('organizer', 'super_admin'), deleteTicketTypeById);

module.exports = router;
