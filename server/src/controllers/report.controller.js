const mongoose = require('mongoose');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const CheckInLog = require('../models/CheckInLog.model');
const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const User = require('../models/User.model');
const { ok, fail } = require('../utils/apiResponse');
const { auditReportSchema } = require('../validators/report.validator');

async function resolveEventScope(req, eventId) {
  if (req.user.role !== 'organizer') return eventId ? { _id: eventId } : null;

  const eventFilter = { organizationId: req.user.organizationId };
  if (eventId) eventFilter._id = eventId;
  const events = await Event.find(eventFilter).select('_id name').lean();
  if (eventId && events.length === 0) return false;
  return { $in: events.map(event => event._id) };
}

async function findAuditRows(req, query) {
  const eventScope = await resolveEventScope(req, query.eventId);
  if (eventScope === false) return null;

  const filter = {};
  if (eventScope) filter.eventId = eventScope;
  if (query.result) filter.result = query.result;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = query.from;
    if (query.to) filter.createdAt.$lte = query.to;
  }

  if (query.search) {
    const expression = { $regex: query.search, $options: 'i' };
    const [events, attendees, users] = await Promise.all([
      Event.find({ name: expression }).select('_id').lean(),
      Attendee.find({ $or: [{ fullName: expression }, { email: expression }] }).select('_id').lean(),
      User.find({ $or: [{ name: expression }, { email: expression }] }).select('_id').lean()
    ]);
    filter.$or = [
      { eventId: { $in: events.map(item => item._id) } },
      { attendeeId: { $in: attendees.map(item => item._id) } },
      { scannedBy: { $in: users.map(item => item._id) } }
    ];
  }

  return CheckInLog.find(filter)
    .populate('eventId', 'name')
    .populate('attendeeId', 'fullName email')
    .populate('scannedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
}

function normalizeRows(rows) {
  return rows.map(row => ({
    eventId: row.eventId?._id || row.eventId,
    attendeeId: row.attendeeId?._id || row.attendeeId,
    timestamp: row.createdAt,
    event: row.eventId?.name || 'Unknown Event',
    attendee: row.attendeeId?.fullName || 'Unknown',
    attendeeEmail: row.attendeeId?.email || '',
    scannedBy: row.scannedBy?.name || 'Unknown',
    deviceId: row.deviceId || '',
    gate: row.gate || '',
    result: row.result
  }));
}

function sendXlsx(res, rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows.map(row => ({
    'Event ID': row.eventId,
    'Attendee ID': row.attendeeId,
    Timestamp: row.timestamp,
    Event: row.event,
    Attendee: row.attendee,
    Email: row.attendeeEmail,
    'Scanned By': row.scannedBy,
    'Device ID': row.deviceId,
    Gate: row.gate,
    Result: row.result
  })));
  worksheet['!cols'] = [{ wch: 24 }, { wch: 28 }, { wch: 24 }, { wch: 32 }, { wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="security-audit-report.xlsx"' });
  return res.send(buffer);
}

function sendPdf(res, rows) {
  const document = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const chunks = [];
  document.on('data', chunk => chunks.push(chunk));
  document.on('end', () => {
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="security-audit-report.pdf"' });
    res.send(Buffer.concat(chunks));
  });
  document.fontSize(18).text('Security Audit Report');
  document.moveDown(0.5).fontSize(9).fillColor('#555').text(`Generated: ${new Date().toISOString()} | Records: ${rows.length}`);
  document.moveDown();
  document.fillColor('#111').fontSize(8);
  const columns = [
    ['Timestamp', 105], ['Event', 125], ['Attendee', 115], ['Scanned By', 105], ['Device', 85], ['Gate', 70], ['Result', 75]
  ];
  let x = document.x;
  const headerY = document.y;
  columns.forEach(([label, width]) => { document.rect(x, headerY, width, 20).fillAndStroke('#E2E8F0', '#CBD5E1'); document.fillColor('#111').text(label, x + 4, headerY + 6, { width: width - 8 }); x += width; });
  let y = headerY + 20;
  rows.forEach(row => {
    if (y > 540) { document.addPage(); y = 40; }
    x = document.x;
    const values = [new Date(row.timestamp).toLocaleString('vi-VN'), row.event, `${row.attendee} ${row.attendeeEmail}`.trim(), row.scannedBy, row.deviceId, row.gate, row.result];
    columns.forEach(([, width], index) => { document.rect(x, y, width, 20).stroke('#E2E8F0'); document.fillColor('#111').text(String(values[index] || ''), x + 4, y + 6, { width: width - 8, ellipsis: true }); x += width; });
    y += 20;
  });
  document.end();
}

async function exportAuditReport(req, res, next) {
  const parsed = auditReportSchema.safeParse(req.query);
  if (!parsed.success) return fail(res, 400, 'Tham số export không hợp lệ', 'VALIDATION_ERROR');
  try {
    const rows = await findAuditRows(req, parsed.data);
    if (rows === null) return fail(res, 403, 'Bạn không có quyền export event này', 'FORBIDDEN');
    const normalized = normalizeRows(rows);
    if (parsed.data.format === 'pdf') return sendPdf(res, normalized);
    return sendXlsx(res, normalized);
  } catch (error) {
    next(error);
  }
}

module.exports = { exportAuditReport };
