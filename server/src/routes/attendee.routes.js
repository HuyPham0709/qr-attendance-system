const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { attendeePublicRateLimiter, scanRateLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  registerAttendee,
  lookupTickets,
  resendQrEmail,
  listAttendees,
  getAttendee,
  createAttendee,
  updateAttendee,
  deleteAttendee,
  importAttendees
} = require('../controllers/attendee.controller');
const { scanCheckIn, manualCheckIn } = require('../controllers/checkin.controller');
const { getAttendeeQr, revokeAttendeeQr } = require('../controllers/qr.controller');
const {
  registerAttendeeSchema,
  lookupTicketsSchema,
  resendQrEmailSchema,
  createAttendeeSchema,
  updateAttendeeSchema
} = require('../validators/attendee.validator');
const { scanCheckInSchema, manualCheckInSchema } = require('../validators/checkin.validator');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV'));
    }
  }
});

router.post(
  '/register',
  attendeePublicRateLimiter,
  validate(registerAttendeeSchema),
  registerAttendee
);


router.get(
  '/lookup',
  attendeePublicRateLimiter,
  validate(lookupTicketsSchema, 'query'),
  lookupTickets
);

router.post(
  '/resend',
  attendeePublicRateLimiter,
  validate(resendQrEmailSchema),
  resendQrEmail
);

// --- Attendee CRUD (organizer / super_admin / scanner_staff, có authenticate) ---
router.get('/', authenticate, authorize('super_admin', 'organizer', 'scanner_staff'), listAttendees);
router.get('/:id', authenticate, authorize('super_admin', 'organizer', 'scanner_staff'), getAttendee);
router.post('/', authenticate, authorize('super_admin', 'organizer'), validate(createAttendeeSchema), createAttendee);
router.patch('/:id', authenticate, authorize('super_admin', 'organizer'), validate(updateAttendeeSchema), updateAttendee);
router.delete('/:id', authenticate, authorize('super_admin', 'organizer'), deleteAttendee);
router.post('/import', authenticate, authorize('super_admin', 'organizer'), upload.single('file'), importAttendees);

// Check-in
router.post('/scan', authenticate, authorize('scanner_staff', 'organizer', 'super_admin'), scanRateLimiter, validate(scanCheckInSchema), scanCheckIn);
router.post('/manual', authenticate, authorize('scanner_staff', 'organizer', 'super_admin'), validate(manualCheckInSchema), manualCheckIn);

// QR
router.get('/:id/qr', authenticate, authorize('scanner_staff', 'organizer', 'super_admin'), getAttendeeQr);
router.post('/:id/qr/revoke', authenticate, authorize('organizer', 'super_admin'), revokeAttendeeQr);

module.exports = router;
