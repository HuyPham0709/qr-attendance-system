// server/src/utils/seed.js
//
// Seed dữ liệu mẫu cho dev/test: 1 Organization, 3 User (mỗi role 1 người),
// 1 Event có 2 gate, 2 TicketType, ~16 Attendee (một số đã check-in sẵn để
// có dữ liệu test Sprint 3), vài CheckInLog tương ứng.
//
// Chạy:  npm run seed        (xem script trong package.json)
// hoặc:  node src/utils/seed.js
//
// Script XÓA SẠCH data cũ của các collection liên quan trước khi seed lại,
// để chạy nhiều lần không bị lỗi trùng unique index (email, slug, qrCode...).
// KHÔNG chạy script này nhắm vào DB production.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const Organization = require('../models/Organization.model');
const User = require('../models/User.model');
const Event = require('../models/Event.model');
const TicketType = require('../models/TicketType.model');
const Attendee = require('../models/Attendee.model');
const CheckInLog = require('../models/CheckInLog.model');

// Danh sách tên mẫu để tạo attendee, không cần cài thêm package (faker...).
const SAMPLE_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Thị Duyên',
  'Hoàng Văn Em', 'Vũ Thị Phương', 'Đặng Minh Giang', 'Bùi Thị Hoa',
  'Ngô Văn Inh', 'Đỗ Thị Kim', 'Dương Văn Long', 'Lý Thị Mai',
  'Phan Văn Nam', 'Tô Thị Oanh', 'Đinh Văn Phúc', 'Trịnh Thị Quyên'
];

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function clearCollections() {
  await Promise.all([
    Organization.deleteMany({}),
    User.deleteMany({}),
    Event.deleteMany({}),
    TicketType.deleteMany({}),
    Attendee.deleteMany({}),
    CheckInLog.deleteMany({})
  ]);
  console.log('🧹 Đã xóa data cũ trong 6 collection.');
}

async function seedOrganization() {
  const org = await Organization.create({
    name: 'CLB Công nghệ ABC',
    slug: 'clb-cong-nghe-abc',
    plan: 'pro'
  });
  console.log('✅ Organization:', org.name);
  return org;
}

async function seedUsers(organizationId) {
  // Mật khẩu demo cho cả 3 tài khoản: "123456" (đã hash).
  const passwordHash = await bcrypt.hash('123456', 10);

  const users = await User.insertMany([
    {
      organizationId,
      name: 'Admin Tổng',
      email: 'admin@demo.com',
      passwordHash,
      role: 'super_admin'
    },
    {
      organizationId,
      name: 'Ban Tổ Chức',
      email: 'organizer@demo.com',
      passwordHash,
      role: 'organizer'
    },
    {
      organizationId,
      name: 'Nhân Viên Soát Vé',
      email: 'scanner@demo.com',
      passwordHash,
      role: 'scanner_staff'
    }
  ]);
  console.log(`✅ Users: ${users.length} tài khoản (mật khẩu demo: 123456)`);
  return users;
}

async function seedEvent(organizationId) {
  const now = Date.now();
  const event = await Event.create({
    organizationId,
    name: 'Tech Summit 2026',
    slug: slugify(`tech-summit-2026-${now}`),
    description: 'Sự kiện công nghệ thường niên của CLB.',
    location: {
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      geo: { lat: 10.7769, lng: 106.7009 },
      geoFenceRadiusMeters: 200
    },
    startAt: new Date(now + 3 * 24 * 60 * 60 * 1000), // 3 ngày nữa
    endAt: new Date(now + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // +4h
    status: 'published',
    settings: {
      allowMultipleCheckIn: false,
      requireGeoFence: false,
      qrTokenTTLMinutes: 0, // đổi thành >0 để test rotating QR
      checkInWindowMinutes: 60
    },
    gates: [
      { name: 'Cổng A', code: 'GATE_A' },
      { name: 'Cổng B', code: 'GATE_B' }
    ]
  });
  console.log('✅ Event:', event.name, `(slug: ${event.slug})`);
  return event;
}

async function seedTicketTypes(eventId) {
  const ticketTypes = await TicketType.insertMany([
    { eventId, name: 'Standard', quantityLimit: 200, price: 0, allowedSessions: [] },
    { eventId, name: 'VIP', quantityLimit: 30, price: 500000, allowedSessions: ['main-stage', 'workshop'] }
  ]);
  console.log(`✅ TicketType: ${ticketTypes.length} loại vé`);
  return ticketTypes;
}

async function seedAttendees(event, ticketTypes, scannerUser) {
  const [standard, vip] = ticketTypes;
  const attendees = [];

  // Tạo từng attendee bằng .create() (không dùng insertMany) để trigger
  // đúng hook pre('validate') trong Attendee.model.js — hook đó tự sinh
  // qrSecret + qrCode riêng cho mỗi người. insertMany() SẼ BỎ QUA hook này.
  for (let i = 0; i < SAMPLE_NAMES.length; i++) {
    const fullName = SAMPLE_NAMES[i];
    const emailLocal = slugify(fullName).replace(/-/g, '.');
    const isVip = i < 3; // 3 người đầu là VIP cho đa dạng dữ liệu

    const attendee = await Attendee.create({
      eventId: event._id,
      ticketTypeId: isVip ? vip._id : standard._id,
      fullName,
      email: `${emailLocal}@example.com`,
      phone: `09${String(10000000 + i).slice(0, 8)}`
    });
    attendees.push(attendee);
  }
  console.log(`✅ Attendee: ${attendees.length} người (đã tự sinh qrSecret/qrCode qua hook)`);

  // Cho 5 người đầu đã check-in sẵn, để có data test Sprint 3 (dashboard,
  // report, chống check-in trùng...).
  const checkedInCount = 5;
  const checkInLogs = [];

  for (let i = 0; i < checkedInCount; i++) {
    const attendee = attendees[i];
    const checkInAt = new Date(Date.now() - (checkedInCount - i) * 5 * 60 * 1000);

    attendee.status = 'checked_in';
    attendee.checkIn = {
      isCheckedIn: true,
      checkInAt,
      checkInBy: scannerUser._id,
      gate: i % 2 === 0 ? 'GATE_A' : 'GATE_B',
      method: 'qr_scan',
      deviceInfo: 'Seed script'
    };
    await attendee.save();

    checkInLogs.push({
      eventId: event._id,
      attendeeId: attendee._id,
      result: 'success',
      scannedBy: scannerUser._id,
      gate: attendee.checkIn.gate,
      deviceId: 'seed-device-01',
      offlineSynced: false,
      clientTimestamp: checkInAt,
      createdAt: checkInAt
    });
  }

  await CheckInLog.insertMany(checkInLogs);
  console.log(`✅ CheckInLog: ${checkInLogs.length} bản ghi (tương ứng ${checkedInCount} người đã check-in)`);

  // Cập nhật stats trên Event cho khớp dữ liệu vừa seed.
  event.stats.totalRegistered = attendees.length;
  event.stats.totalCheckedIn = checkedInCount;
  await event.save();

  return attendees;
}

async function run() {
  try {
    await connectDB();

    await clearCollections();

    const org = await seedOrganization();
    const users = await seedUsers(org._id);
    const scannerUser = users.find((u) => u.role === 'scanner_staff');

    const event = await seedEvent(org._id);
    const ticketTypes = await seedTicketTypes(event._id);
    await seedAttendees(event, ticketTypes, scannerUser);

    console.log('\n🎉 Seed xong. Tài khoản demo (mật khẩu: 123456):');
    console.log('   - admin@demo.com     (super_admin)');
    console.log('   - organizer@demo.com (organizer)');
    console.log('   - scanner@demo.com   (scanner_staff)');
    console.log(`\n👉 Event id: ${event._id}  (dùng để test GET /api/attendees/:id/qr với 1 attendee bất kỳ thuộc event này)`);
  } catch (err) {
    console.error('❌ Seed thất bại:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();