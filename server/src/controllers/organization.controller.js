const mongoose = require('mongoose');
const Organization = require('../models/Organization.model');
const Event = require('../models/Event.model');
const { ok, fail } = require('../utils/apiResponse');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createOrganizationSchema, updateOrganizationSchema } = require('../validators/organization.validator');

async function listOrganizations(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [orgs, total] = await Promise.all([
      Organization.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Organization.countDocuments(filter)
    ]);

    const orgsWithCount = orgs.map(org => ({
      ...org,
      eventsCount: 0
    }));

    return ok(res, {
      data: orgsWithCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

async function getOrganization(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Organization ID không hợp lệ', 'INVALID_ID');
    }

    const org = await Organization.findById(id).lean();
    if (!org) {
      return fail(res, 404, 'Không tìm thấy tổ chức', 'ORGANIZATION_NOT_FOUND');
    }

    return ok(res, org);
  } catch (err) {
    next(err);
  }
}

async function createOrganization(req, res, next) {
  try {
    const payload = req.body;
    payload.ownerEmail = req.user.email;

    const org = await Organization.create(payload);
    return ok(res, org, 201);
  } catch (err) {
    if (err.code === 11000) {
      return fail(res, 409, 'Slug đã tồn tại', 'DUPLICATE_SLUG');
    }
    next(err);
  }
}

async function updateOrganization(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Organization ID không hợp lệ', 'INVALID_ID');
    }

    const org = await Organization.findById(id);
    if (!org) {
      return fail(res, 404, 'Không tìm thấy tổ chức', 'ORGANIZATION_NOT_FOUND');
    }

    const updated = await Organization.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    return ok(res, updated);
  } catch (err) {
    if (err.code === 11000) {
      return fail(res, 409, 'Slug đã tồn tại', 'DUPLICATE_SLUG');
    }
    next(err);
  }
}

async function deleteOrganization(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Organization ID không hợp lệ', 'INVALID_ID');
    }

    const org = await Organization.findById(id);
    if (!org) {
      return fail(res, 404, 'Không tìm thấy tổ chức', 'ORGANIZATION_NOT_FOUND');
    }

    await Organization.findByIdAndDelete(id);
    return ok(res, { message: 'Tổ chức đã được xóa' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
