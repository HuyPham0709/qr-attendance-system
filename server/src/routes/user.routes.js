const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignEvents
} = require('../controllers/user.controller');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');

const router = express.Router();

router.get('/', authenticate, authorize('super_admin', 'organizer'), listUsers);
router.get('/:id', authenticate, authorize('super_admin', 'organizer'), getUser);
router.post('/', authenticate, authorize('super_admin', 'organizer'), validate(createUserSchema), createUser);
router.patch('/:id', authenticate, authorize('super_admin', 'organizer'), validate(updateUserSchema), updateUser);
router.delete('/:id', authenticate, authorize('super_admin', 'organizer'), deleteUser);
router.patch('/:id/assign-events', authenticate, authorize('super_admin', 'organizer'), assignEvents);

module.exports = router;
