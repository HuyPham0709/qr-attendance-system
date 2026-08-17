/**
 * Script TẠM để tạo user test, tách riêng khỏi seed.js hiện có của bạn
 * (mình chưa có nội dung seed.js nên không sửa trực tiếp vào đó).
 * Xoá file này sau khi Thành viên A tích hợp việc tạo user vào seed.js chính thức.
 *
 * Chạy: node src/utils/createTestUser.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User.model');
const Organization = require('../models/Organization.model');

const TEST_USERS = [
  { email: 'admin@test.com', password: 'Test1234!', role: 'super_admin', name: 'Admin Test' },
  { email: 'organizer@test.com', password: 'Test1234!', role: 'organizer', name: 'Organizer Test' },
  { email: 'scanner@test.com', password: 'Test1234!', role: 'scanner_staff', name: 'Scanner Test' }
];

async function run() {
  await connectDB();

  let org = await Organization.findOne({ slug: 'test-org' });
  if (!org) {
    org = await Organization.create({ name: 'Test Org', slug: 'test-org' });
    console.log('Đã tạo Organization test-org');
  }

  for (const u of TEST_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`Bỏ qua (đã tồn tại): ${u.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 12);
    await User.create({
      organizationId: org._id,
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role
    });
    console.log(`Đã tạo: ${u.email} / ${u.password} / role=${u.role}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});