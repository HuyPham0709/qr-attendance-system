const mongoose = require('mongoose');
const XLSX = require('xlsx');
const CheckInLog = require('../models/CheckInLog.model');
const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const { ok, fail } = require('../utils/apiResponse');

const RESULTS = new Set(['success', 'duplicate', 'invalid_qr', 'expired_qr', 'wrong_geo', 'revoked']);

function value(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return String(row[key]).trim();
  }
  return '';
}

async function importAuditLogs(req, res, next) {
  try {
    if (!req.file) return fail(res, 400, 'Thiếu file import', 'MISSING_FILE');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) return fail(res, 400, 'File không có dữ liệu', 'EMPTY_FILE');

    const errors = [];
    const prepared = [];
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const line = index + 2;
      const eventId = value(row, 'eventId', 'Event ID', 'event_id');
      const attendeeId = value(row, 'attendeeId', 'Attendee ID', 'attendee_id');
      const result = value(row, 'result', 'Result').toLowerCase();
      const gate = value(row, 'gate', 'Gate');
      const deviceId = value(row, 'deviceId', 'Device ID', 'device_id');
      const timestamp = value(row, 'clientTimestamp', 'Client Timestamp', 'Timestamp', 'createdAt');

      if (!mongoose.Types.ObjectId.isValid(eventId)) errors.push({ row: line, error: 'eventId không hợp lệ' });
      if (!mongoose.Types.ObjectId.isValid(attendeeId)) errors.push({ row: line, error: 'attendeeId không hợp lệ' });
      if (!RESULTS.has(result)) errors.push({ row: line, error: `result không hợp lệ: ${result}` });
      const parsedDate = timestamp ? new Date(timestamp) : new Date();
      if (Number.isNaN(parsedDate.getTime())) errors.push({ row: line, error: 'clientTimestamp không hợp lệ' });
      prepared.push({ line, eventId, attendeeId, result, gate, deviceId, clientTimestamp: parsedDate });
    }

    if (errors.length) return fail(res, 400, 'File có dòng không hợp lệ', 'IMPORT_VALIDATION_ERROR', errors);

    const eventIds = [...new Set(prepared.map(row => row.eventId))];
    const attendeeIds = [...new Set(prepared.map(row => row.attendeeId))];
    const [events, attendees] = await Promise.all([
      Event.find({ _id: { $in: eventIds } }).select('_id organizationId').lean(),
      Attendee.find({ _id: { $in: attendeeIds } }).select('_id eventId').lean()
    ]);
    const eventMap = new Map(events.map(event => [String(event._id), event]));
    const attendeeMap = new Map(attendees.map(attendee => [String(attendee._id), attendee]));

    for (const row of prepared) {
      const event = eventMap.get(row.eventId);
      const attendee = attendeeMap.get(row.attendeeId);
      if (!event) errors.push({ row: row.line, error: 'Không tìm thấy event' });
      if (!attendee) errors.push({ row: row.line, error: 'Không tìm thấy attendee' });
      if (event && req.user.role === 'organizer' && String(event.organizationId) !== String(req.user.organizationId)) errors.push({ row: row.line, error: 'Không có quyền với event' });
      if (event && attendee && String(attendee.eventId) !== String(event._id)) errors.push({ row: row.line, error: 'attendee không thuộc event' });
    }
    if (errors.length) return fail(res, 400, 'File không hợp lệ, chưa có dữ liệu nào được import', 'IMPORT_VALIDATION_ERROR', errors);

    const documents = prepared.map(row => ({ eventId: row.eventId, attendeeId: row.attendeeId, result: row.result, scannedBy: req.user.id, gate: row.gate || undefined, deviceId: row.deviceId || undefined, clientTimestamp: row.clientTimestamp }));
    await CheckInLog.insertMany(documents, { ordered: true });
    return ok(res, { imported: documents.length, failed: 0 });
  } catch (err) {
    next(err);
  }
}

module.exports = { importAuditLogs };
