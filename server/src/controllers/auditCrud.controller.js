const mongoose = require('mongoose');
const CheckInLog = require('../models/CheckInLog.model');
const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const { ok, fail } = require('../utils/apiResponse');

const RESULTS = ['success', 'duplicate', 'invalid_qr', 'expired_qr', 'wrong_geo', 'revoked'];

function validId(value) { return mongoose.Types.ObjectId.isValid(value); }

async function validateReferences(req, eventId, attendeeId) {
  if (!validId(eventId) || !validId(attendeeId)) return { error: 'eventId hoặc attendeeId không hợp lệ' };
  const [event, attendee] = await Promise.all([
    Event.findById(eventId).select('_id organizationId').lean(),
    Attendee.findById(attendeeId).select('_id eventId').lean()
  ]);
  if (!event) return { error: 'Không tìm thấy event' };
  if (!attendee) return { error: 'Không tìm thấy attendee' };
  if (String(attendee.eventId) !== String(event._id)) return { error: 'Attendee không thuộc event' };
  if (req.user.role === 'organizer' && String(event.organizationId) !== String(req.user.organizationId)) return { forbidden: true };
  return { event, attendee };
}

async function getLogForUser(req, id) {
  if (!validId(id)) return { error: 'Log ID không hợp lệ' };
  const log = await CheckInLog.findById(id).lean();
  if (!log) return { notFound: true };
  const references = await validateReferences(req, log.eventId, log.attendeeId);
  if (references.forbidden) return { forbidden: true };
  if (references.error) return { error: references.error };
  return { log };
}

function parsePayload(body) {
  const result = String(body.result || '').trim().toLowerCase();
  const payload = {
    eventId: body.eventId,
    attendeeId: body.attendeeId,
    result,
    gate: body.gate?.trim() || undefined,
    deviceId: body.deviceId?.trim() || undefined,
    clientTimestamp: body.clientTimestamp ? new Date(body.clientTimestamp) : new Date()
  };
  if (!RESULTS.includes(result)) return { error: 'result không hợp lệ' };
  if (Number.isNaN(payload.clientTimestamp.getTime())) return { error: 'clientTimestamp không hợp lệ' };
  return { payload };
}

async function createAuditLog(req, res, next) {
  try {
    const parsed = parsePayload(req.body);
    if (parsed.error) return fail(res, 400, parsed.error, 'VALIDATION_ERROR');
    const references = await validateReferences(req, parsed.payload.eventId, parsed.payload.attendeeId);
    if (references.forbidden) return fail(res, 403, 'Không có quyền với event này', 'FORBIDDEN');
    if (references.error) return fail(res, 400, references.error, 'VALIDATION_ERROR');
    const log = await CheckInLog.create({ ...parsed.payload, scannedBy: req.user.id });
    return ok(res, log, 201);
  } catch (error) { next(error); }
}

async function updateAuditLog(req, res, next) {
  try {
    const current = await getLogForUser(req, req.params.id);
    if (current.notFound) return fail(res, 404, 'Không tìm thấy audit log', 'LOG_NOT_FOUND');
    if (current.forbidden) return fail(res, 403, 'Không có quyền với audit log này', 'FORBIDDEN');
    if (current.error) return fail(res, 400, current.error, 'VALIDATION_ERROR');
    const parsed = parsePayload({ ...current.log, ...req.body });
    if (parsed.error) return fail(res, 400, parsed.error, 'VALIDATION_ERROR');
    const references = await validateReferences(req, parsed.payload.eventId, parsed.payload.attendeeId);
    if (references.forbidden) return fail(res, 403, 'Không có quyền với event này', 'FORBIDDEN');
    if (references.error) return fail(res, 400, references.error, 'VALIDATION_ERROR');
    const updated = await CheckInLog.findByIdAndUpdate(req.params.id, { ...parsed.payload, scannedBy: current.log.scannedBy || req.user.id }, { new: true, runValidators: true });
    return ok(res, updated);
  } catch (error) { next(error); }
}

async function deleteAuditLog(req, res, next) {
  try {
    const current = await getLogForUser(req, req.params.id);
    if (current.notFound) return fail(res, 404, 'Không tìm thấy audit log', 'LOG_NOT_FOUND');
    if (current.forbidden) return fail(res, 403, 'Không có quyền với audit log này', 'FORBIDDEN');
    if (current.error) return fail(res, 400, current.error, 'VALIDATION_ERROR');
    await CheckInLog.findByIdAndDelete(req.params.id);
    return ok(res, { message: 'Audit log đã được xóa' });
  } catch (error) { next(error); }
}

module.exports = { createAuditLog, updateAuditLog, deleteAuditLog };
