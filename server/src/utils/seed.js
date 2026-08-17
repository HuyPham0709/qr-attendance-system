require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Organization = require('../models/Organization.model');
const User = require('../models/User.model');
const Event = require('../models/Event.model');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qr_attendance';
    await mongoose.connect(mongoUri);
    console.log('🌱 1. Kết nối MongoDB thành công...');

    // Clear data
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Event.deleteMany({});
    console.log('🧹 2. Đã dọn dẹp dữ liệu cũ...');

    // 1. Tạo Organization
    const org = await Organization.create({
      name: 'Ban Tổ Chức Sự Kiện FPT',
      slug: 'fpt-events',
      plan: 'pro'
    });
    console.log('🏢 3. Đã tạo Collection Organizations!');

    // 2. Tạo Password Hash & Users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    await User.create([
      {
        organizationId: org._id,
        name: 'Leader Admin',
        email: 'admin@fpt.edu.vn',
        passwordHash,
        role: 'organizer'
      },
      {
        organizationId: org._id,
        name: 'Nhân viên Soát vé A',
        email: 'staff1@fpt.edu.vn',
        passwordHash,
        role: 'scanner_staff'
      }
    ]);
    console.log('👤 4. Đã tạo Collection Users!');

    // 3. Tạo Event
    const event = await Event.create({
      organizationId: org._id,
      name: 'Hội thảo Công nghệ TechDay 2026',
      slug: 'techday-2026',
      description: 'Sự kiện trải nghiệm công nghệ hàng đầu',
      startAt: new Date(),
      endAt: new Date(Date.now() + 86400000 * 2),
      status: 'published',
      gates: [
        { name: 'Cổng Chính A', code: 'GATE_A' },
        { name: 'Cổng Phụ B', code: 'GATE_B' }
      ]
    });
    console.log('📅 5. Đã tạo Collection Events!');

    console.log('--------------------------------------------------');
    console.log('✅ HOÀN TẤT NẠP TOÀN BỘ 3 COLLECTIONS!');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi chi tiết:', error);
    process.exit(1);
  }
};

seedData();
