const mongoose = require('mongoose');
const User = require('../models/User.model');
const Event = require('../models/Event.model');
const { ok, fail } = require('../utils/apiResponse');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');

async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { role, search } = req.query;

    const filter = {};

    if (req.user.role === 'organizer') {
      filter.organizationId = req.user.organizationId;
    }

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -twoFactorSecret -twoFactorTempSecret')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const safeUsers = users.map(u => ({
      ...u,
      status: u.isActive ? 'Active' : 'Inactive'
    }));

    return ok(res, {
      data: safeUsers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'User ID không hợp lệ', 'INVALID_ID');
    }

    const user = await User.findById(id)
      .select('-passwordHash -twoFactorSecret -twoFactorTempSecret')
      .lean();

    if (!user) {
      return fail(res, 404, 'Không tìm thấy user', 'USER_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && user.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return fail(res, 403, 'Bạn không có quyền xem user này', 'FORBIDDEN');
    }

    return ok(res, { ...user, status: user.isActive ? 'Active' : 'Inactive' });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const payload = req.body;

    if (req.user.role === 'organizer') {
      payload.organizationId = req.user.organizationId;
      if (payload.role === 'super_admin') {
        return fail(res, 403, 'Organizer không thể tạo super_admin', 'FORBIDDEN');
      }
    }

    const existing = await User.findOne({ email: payload.email });
    if (existing) {
      return fail(res, 409, 'Email đã tồn tại', 'DUPLICATE_EMAIL');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await User.create({
      ...payload,
      passwordHash
    });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.twoFactorSecret;
    delete safeUser.twoFactorTempSecret;

    return ok(res, { ...safeUser, status: safeUser.isActive ? 'Active' : 'Inactive' }, 201);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'User ID không hợp lệ', 'INVALID_ID');
    }

    const user = await User.findById(id);
    if (!user) {
      return fail(res, 404, 'Không tìm thấy user', 'USER_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && user.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return fail(res, 403, 'Bạn không có quyền sửa user này', 'FORBIDDEN');
    }

    if (req.body.password) {
      req.body.passwordHash = await bcrypt.hash(req.body.password, 10);
      delete req.body.password;
    }

    const updated = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .select('-passwordHash -twoFactorSecret -twoFactorTempSecret')
      .lean();

    return ok(res, { ...updated, status: updated.isActive ? 'Active' : 'Inactive' });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'User ID không hợp lệ', 'INVALID_ID');
    }

    if (id === req.user.id) {
      return fail(res, 400, 'Không thể xóa tài khoản của chính mình', 'CANNOT_DELETE_SELF');
    }

    const user = await User.findById(id);
    if (!user) {
      return fail(res, 404, 'Không tìm thấy user', 'USER_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && user.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return fail(res, 403, 'Bạn không có quyền xóa user này', 'FORBIDDEN');
    }

    await User.findByIdAndDelete(id);
    return ok(res, { message: 'User đã được xóa' });
  } catch (err) {
    next(err);
  }
}

async function assignEvents(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'User ID không hợp lệ', 'INVALID_ID');
    }

    const user = await User.findById(id);
    if (!user) {
      return fail(res, 404, 'Không tìm thấy user', 'USER_NOT_FOUND');
    }

    if (user.role !== 'scanner_staff') {
      return fail(res, 400, 'Chỉ có thể gán sự kiện cho Scanner Staff', 'INVALID_ROLE');
    }

    if (req.user.role === 'organizer' && user.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return fail(res, 403, 'Bạn không có quyền gán sự kiện cho user này', 'FORBIDDEN');
    }

    const { eventIds } = req.body;
    user.assignedEvents = eventIds || [];
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.twoFactorSecret;
    delete safeUser.twoFactorTempSecret;

    return ok(res, { ...safeUser, status: safeUser.isActive ? 'Active' : 'Inactive' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignEvents
};
