const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization
} = require('../controllers/organization.controller');
const { createOrganizationSchema, updateOrganizationSchema } = require('../validators/organization.validator');

const router = express.Router();

router.get('/', authenticate, authorize('super_admin'), listOrganizations);
router.get('/:id', authenticate, authorize('super_admin'), getOrganization);
router.post('/', authenticate, authorize('super_admin'), validate(createOrganizationSchema), createOrganization);
router.patch('/:id', authenticate, authorize('super_admin'), validate(updateOrganizationSchema), updateOrganization);
router.delete('/:id', authenticate, authorize('super_admin'), deleteOrganization);

module.exports = router;
