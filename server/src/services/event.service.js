function validateEventPayload(payload = {}) {
  const errors = [];

  if (!payload.organizationId) {
    errors.push({ path: ['organizationId'], message: 'organizationId là bắt buộc' });
  }

  if (!payload.name || !String(payload.name).trim()) {
    errors.push({ path: ['name'], message: 'name là bắt buộc' });
  }

  if (!payload.startAt) {
    errors.push({ path: ['startAt'], message: 'startAt là bắt buộc' });
  }

  if (!payload.endAt) {
    errors.push({ path: ['endAt'], message: 'endAt là bắt buộc' });
  }

  if (payload.startAt && payload.endAt) {
    const start = new Date(payload.startAt).getTime();
    const end = new Date(payload.endAt).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) {
      errors.push({ path: ['startAt', 'endAt'], message: 'startAt/endAt phải là ISO date hợp lệ' });
    } else if (start >= end) {
      errors.push({ path: ['endAt'], message: 'endAt phải lớn hơn startAt' });
    }
  }

  const normalized = {
    organizationId: payload.organizationId,
    name: payload.name?.trim(),
    slug: payload.slug || undefined,
    description: payload.description || undefined,
    banner: payload.banner || undefined,
    location: payload.location || undefined,
    startAt: payload.startAt ? new Date(payload.startAt) : undefined,
    endAt: payload.endAt ? new Date(payload.endAt) : undefined,
    status: payload.status || 'draft',
    settings: {
      allowMultipleCheckIn: Boolean(payload.settings?.allowMultipleCheckIn),
      requireGeoFence: Boolean(payload.settings?.requireGeoFence),
      qrTokenTTLMinutes: Number(payload.settings?.qrTokenTTLMinutes ?? 0),
      checkInWindowMinutes: Number(payload.settings?.checkInWindowMinutes ?? 60)
    },
    gates: Array.isArray(payload.gates) ? payload.gates.map((gate, index) => ({
      name: String(gate?.name || `Cổng ${index + 1}`),
      code: gate?.code || `GATE_${index + 1}`
    })) : []
  };

  return {
    valid: errors.length === 0,
    errors,
    data: normalized
  };
}

function buildEventQuery(filters = {}) {
  const query = {};

  if (filters.organizationId) {
    query.organizationId = filters.organizationId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return query;
}

module.exports = {
  validateEventPayload,
  buildEventQuery
};
