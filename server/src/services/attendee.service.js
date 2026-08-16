function validateAttendeeRegistration(payload = {}) {
  const errors = [];

  if (!payload.eventId) {
    errors.push({ path: ['eventId'], message: 'eventId là bắt buộc' });
  }

  if (!payload.fullName || !String(payload.fullName).trim()) {
    errors.push({ path: ['fullName'], message: 'fullName là bắt buộc' });
  }

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.push({ path: ['email'], message: 'email không hợp lệ' });
  }

  const normalized = {
    eventId: payload.eventId,
    ticketTypeId: payload.ticketTypeId || undefined,
    fullName: String(payload.fullName || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    phone: payload.phone ? String(payload.phone).trim() : undefined,
    status: payload.status || 'registered',
    customFields: payload.customFields || undefined
  };

  return {
    valid: errors.length === 0,
    errors,
    data: normalized
  };
}

function buildAttendeeQuery(filters = {}) {
  const query = {};

  if (filters.eventId) {
    query.eventId = filters.eventId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    query.$or = [
      { fullName: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return query;
}

module.exports = {
  validateAttendeeRegistration,
  buildAttendeeQuery
};
