const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { exportAuditReport } = require('../controllers/report.controller');
const { importAuditLogs } = require('../controllers/auditImport.controller');

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, callback) => file.originalname.match(/\.(xlsx|xls|csv)$/i)
		? callback(null, true)
		: callback(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV'))
});

router.get('/audit', authenticate, authorize('super_admin', 'organizer'), exportAuditReport);
router.post('/audit/import', authenticate, authorize('super_admin', 'organizer'), upload.single('file'), importAuditLogs);

module.exports = router;
