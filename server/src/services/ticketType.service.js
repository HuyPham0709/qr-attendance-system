function validateTicketTypePayload(payload = {}) {
  const errors = [];

  if (!payload.eventId) {
    errors.push({ path: ['eventId'], message: 'eventId là bắt buộc' });
  }

  if (!payload.name || !String(payload.name).trim()) {
    errors.push({ path: ['name'], message: 'Tên loại vé là bắt buộc' });
  }

  if (typeof payload.price !== 'undefined' && (isNaN(payload.price) || payload.price < 0)) {
    errors.push({ path: ['price'], message: 'Giá phải là số không âm' });
  }

  if (typeof payload.quantityLimit !== 'undefined' && payload.quantityLimit !== null) {
    if (isNaN(payload.quantityLimit) || payload.quantityLimit < 0) {
      errors.push({ path: ['quantityLimit'], message: 'Số lượng phải là số không âm' });
    }
  }

  const normalized = {
    eventId: payload.eventId,
    name: String(payload.name || '').trim(),
    quantityLimit: payload.quantityLimit ?? null,
    price: Number(payload.price ?? 0),
    allowedSessions: Array.isArray(payload.allowedSessions) ? payload.allowedSessions : []
  };

  return {
    valid: errors.length === 0,
    errors,
    data: normalized
  };
}

function buildTicketTypeQuery(filters = {}) {
  const query = {};

  if (filters.eventId) {
    query.eventId = filters.eventId;
  }

  if (filters.search) {
    query.name = { $regex: filters.search, $options: 'i' };
  }

  return query;
}

module.exports = {
  validateTicketTypePayload,
  buildTicketTypeQuery
};
