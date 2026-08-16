const organizations = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'QR Attendance Labs',
    slug: 'qr-attendance-labs',
    email: 'hello@qra.tt',
    phone: '+84 912 345 678',
    address: 'Hanoi, Vietnam',
    website: 'https://qra.tt',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

const users = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f710',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'organizer',
    email: 'organizer@test.com',
    passwordHash: 'hashed_password_placeholder',
    role: 'organizer',
    assignedEvents: ['64d8b9c2f1a2b3c4d5e6f701', '64d8b9c2f1a2b3c4d5e6f702'],
    isActive: true,
    failedLoginAttempts: 0,
    lockUntil: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f711',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'scanner',
    email: 'scanner@test.com',
    passwordHash: 'hashed_password_placeholder',
    role: 'scanner_staff',
    assignedEvents: ['64d8b9c2f1a2b3c4d5e6f701'],
    isActive: true,
    failedLoginAttempts: 0,
    lockUntil: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z'
  }
];

const ticketTypes = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f740',
    name: 'VIP',
    price: 2000000,
    isActive: true,
    eventId: '64d8b9c2f1a2b3c4d5e6f701'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f741',
    name: 'Standard',
    price: 500000,
    isActive: true,
    eventId: '64d8b9c2f1a2b3c4d5e6f701'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f742',
    name: 'Partner',
    price: 0,
    isActive: true,
    eventId: '64d8b9c2f1a2b3c4d5e6f702'
  }
];

const events = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f701',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'Tech Conference 2024',
    slug: 'tech-conference-2024',
    description: 'Hội nghị công nghệ với các buổi chia sẻ và workshop.',
    location: {
      address: 'Hanoi Convention Center, Vietnam',
      geo: { lat: 21.0285, lng: 105.8542 },
      geoFenceRadiusMeters: 200
    },
    startAt: '2024-12-15T08:00:00.000Z',
    endAt: '2024-12-15T17:00:00.000Z',
    status: 'published',
    settings: {
      allowMultipleCheckIn: false,
      requireGeoFence: false,
      qrTokenTTLMinutes: 0
    },
    gates: [
      { name: 'Gate A', code: 'GA001' },
      { name: 'Gate B', code: 'GB001' }
    ],
    stats: {
      totalRegistered: 250,
      totalCheckedIn: 180,
      totalNoShow: 42
    },
    createdAt: '2024-11-01T00:00:00.000Z',
    updatedAt: '2024-11-10T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f702',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'Summer Networking Event',
    slug: 'summer-networking-event',
    description: 'Buổi kết nối và networking dành cho startup và đối tác.',
    location: {
      address: 'Saigon Innovation Hub, HCMC',
      geo: { lat: 10.7769, lng: 106.7009 },
      geoFenceRadiusMeters: 150
    },
    startAt: '2024-12-20T18:00:00.000Z',
    endAt: '2024-12-20T21:00:00.000Z',
    status: 'published',
    settings: {
      allowMultipleCheckIn: false,
      requireGeoFence: true,
      qrTokenTTLMinutes: 1440
    },
    gates: [
      { name: 'Main Entrance', code: 'ME001' }
    ],
    stats: {
      totalRegistered: 120,
      totalCheckedIn: 95,
      totalNoShow: 18
    },
    createdAt: '2024-11-05T00:00:00.000Z',
    updatedAt: '2024-11-12T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f703',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'Product Launch',
    slug: 'product-launch-2024',
    description: 'Ra mắt sản phẩm mới và gặp gỡ báo chí.',
    location: {
      address: 'Da Nang Central Hall',
      geo: { lat: 16.0544, lng: 108.2022 },
      geoFenceRadiusMeters: 300
    },
    startAt: '2024-12-25T10:00:00.000Z',
    endAt: '2024-12-25T16:00:00.000Z',
    status: 'draft',
    settings: {
      allowMultipleCheckIn: false,
      requireGeoFence: false,
      qrTokenTTLMinutes: 0
    },
    gates: [
      { name: 'VIP Entrance', code: 'VIP001' },
      { name: 'General Entrance', code: 'GEN001' }
    ],
    stats: {
      totalRegistered: 0,
      totalCheckedIn: 0,
      totalNoShow: 0
    },
    createdAt: '2024-11-15T00:00:00.000Z',
    updatedAt: '2024-11-15T00:00:00.000Z'
  }
];

const attendees = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f720',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f740',
    fullName: 'Nguyễn Thị Lan',
    email: 'lan.nguyen@example.com',
    phone: '0901234567',
    qrCode: 'qr_attendee_001',
    qrSecret: 'secret_001',
    qrVersion: 1,
    status: 'checked_in',
    checkIn: {
      isCheckedIn: true,
      checkInAt: '2024-12-15T09:15:00.000Z',
      checkInBy: '64d8b9c2f1a2b3c4d5e6f711',
      gate: 'Gate A',
      method: 'qr_scan',
      deviceInfo: 'scanner-device-01'
    },
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    version: 1,
    customFields: {
      registrationSource: 'Website',
      ticketType: 'VIP',
      eventName: 'Tech Conference 2024'
    },
    createdAt: '2024-11-20T00:00:00.000Z',
    updatedAt: '2024-12-15T09:15:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f721',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f741',
    fullName: 'Trần Văn Nam',
    email: 'nam.tran@example.com',
    phone: '0912345678',
    qrCode: 'qr_attendee_002',
    qrSecret: 'secret_002',
    qrVersion: 1,
    status: 'registered',
    checkIn: {
      isCheckedIn: false,
      checkInAt: null,
      checkInBy: null,
      gate: null,
      method: null,
      deviceInfo: null
    },
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    version: 0,
    customFields: {
      registrationSource: 'Email Campaign',
      ticketType: 'Standard',
      eventName: 'Tech Conference 2024'
    },
    createdAt: '2024-11-22T00:00:00.000Z',
    updatedAt: '2024-11-22T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f722',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f742',
    fullName: 'Phạm Minh Huy',
    email: 'huy.pham@example.com',
    phone: '0978123456',
    qrCode: 'qr_attendee_003',
    qrSecret: 'secret_003',
    qrVersion: 1,
    status: 'checked_in',
    checkIn: {
      isCheckedIn: true,
      checkInAt: '2024-12-20T18:30:00.000Z',
      checkInBy: '64d8b9c2f1a2b3c4d5e6f711',
      gate: 'Main Entrance',
      method: 'qr_scan',
      deviceInfo: 'scanner-device-02'
    },
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    version: 1,
    customFields: {
      registrationSource: 'Referral',
      ticketType: 'Partner',
      eventName: 'Summer Networking Event'
    },
    createdAt: '2024-11-26T00:00:00.000Z',
    updatedAt: '2024-12-20T18:30:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f723',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f741',
    fullName: 'Lê Thị Mai',
    email: 'mai.le@example.com',
    phone: '0934567890',
    qrCode: 'qr_attendee_004',
    qrSecret: 'secret_004',
    qrVersion: 1,
    status: 'checked_in',
    checkIn: {
      isCheckedIn: true,
      checkInAt: '2024-12-20T18:42:00.000Z',
      checkInBy: '64d8b9c2f1a2b3c4d5e6f711',
      gate: 'Main Entrance',
      method: 'manual',
      deviceInfo: 'scanner-device-02'
    },
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    version: 1,
    customFields: {
      registrationSource: 'Landing Page',
      ticketType: 'Standard',
      eventName: 'Summer Networking Event'
    },
    createdAt: '2024-11-28T00:00:00.000Z',
    updatedAt: '2024-12-20T18:42:00.000Z'
  }
];

const checkInLogs = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f780',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f720',
    attendeeName: 'Nguyễn Thị Lan',
    eventName: 'Tech Conference 2024',
    gate: 'Gate A',
    result: 'success',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    geo: { lat: 21.0285, lng: 105.8542 },
    offlineSynced: false,
    clientTimestamp: '2024-12-15T08:15:00.000Z',
    createdAt: '2024-12-15T08:15:00.000Z',
    checkInTime: '2024-12-15T08:15:00.000Z',
    hour: '08:00',
    method: 'QR',
    status: 'success',
    scannerName: 'Trần Minh Khoa'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f781',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f721',
    attendeeName: 'Trần Văn Nam',
    eventName: 'Tech Conference 2024',
    gate: 'Gate B',
    result: 'success',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    geo: { lat: 21.0285, lng: 105.8542 },
    offlineSynced: true,
    clientTimestamp: '2024-12-15T08:40:00.000Z',
    createdAt: '2024-12-15T08:40:00.000Z',
    checkInTime: '2024-12-15T08:40:00.000Z',
    hour: '08:00',
    method: 'Manual',
    status: 'success',
    scannerName: 'Đỗ Thu Hằng'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f784',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f722',
    attendeeName: 'Phạm Minh Huy',
    eventName: 'Summer Networking Event',
    gate: 'Main Entrance',
    result: 'success',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    geo: { lat: 10.7769, lng: 106.7009 },
    offlineSynced: true,
    clientTimestamp: '2024-12-20T18:05:00.000Z',
    createdAt: '2024-12-20T18:05:00.000Z',
    checkInTime: '2024-12-20T18:05:00.000Z',
    hour: '18:00',
    method: 'QR',
    status: 'success',
    scannerName: 'Nguyễn Lan Anh'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f785',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f723',
    attendeeName: 'Lê Thị Mai',
    eventName: 'Summer Networking Event',
    gate: 'Main Entrance',
    result: 'success',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    geo: { lat: 10.7769, lng: 106.7009 },
    offlineSynced: true,
    clientTimestamp: '2024-12-20T18:42:00.000Z',
    createdAt: '2024-12-20T18:42:00.000Z',
    checkInTime: '2024-12-20T18:42:00.000Z',
    hour: '18:00',
    method: 'Manual',
    status: 'success',
    scannerName: 'Nguyễn Lan Anh'
  }
];

const reports = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f760',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    eventName: 'Tech Conference 2024',
    date: '2024-12-15',
    totalRegistered: 250,
    totalCheckedIn: 180,
    attendanceRate: 72,
    gateBreakdown: { 'Gate A': 104, 'Gate B': 76 },
    byHour: { '08:00': 18, '09:00': 31, '10:00': 42, '11:00': 39, '12:00': 28, '13:00': 22 },
    topChannels: ['Website', 'Email Campaign', 'Referral'],
    summary: 'Sự kiện diễn ra đúng tiến độ với tỷ lệ check-in ổn định và dịch chuyển vào cổng chính cao hơn kế hoạch.'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f761',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    eventName: 'Summer Networking Event',
    date: '2024-12-20',
    totalRegistered: 120,
    totalCheckedIn: 95,
    attendanceRate: 79,
    gateBreakdown: { 'Main Entrance': 95 },
    byHour: { '18:00': 26, '19:00': 35, '20:00': 22, '21:00': 12 },
    topChannels: ['Landing Page', 'Referral', 'Partner Portal'],
    summary: 'Khán giả tập trung nhiều ở giai đoạn mở đầu, với lượng check-in cao trong 2 giờ đầu sự kiện.'
  }
];

const dashboardStats = {
  eventId: '64d8b9c2f1a2b3c4d5e6f701',
  eventName: 'Tech Conference 2024',
  totalRegistered: 250,
  totalAttendance: 180,
  totalNoShow: 42,
  conversionRate: 72,
  avgCheckInPerHour: 24,
  peakHour: '10:00',
  checkInByHour: { '08:00': 18, '09:00': 31, '10:00': 42, '11:00': 39, '12:00': 28, '13:00': 22 },
  gateSummary: { 'Gate A': 104, 'Gate B': 76 },
  trend: { weekOverWeek: 12, comparedToLastEvent: 8 },
  createdAt: '2024-12-15T00:00:00.000Z',
  updatedAt: '2024-12-15T13:00:00.000Z'
};

const seedData = {
  organizations,
  users,
  ticketTypes,
  events,
  attendees,
  checkInLogs,
  reports,
  dashboardStats
};

async function seedDatabase({ mongoose, models } = {}) {
  if (!mongoose || !models) {
    console.log('Seed data is ready to insert into MongoDB.');
    return seedData;
  }

  const {
    Organization,
    User,
    Event,
    TicketType,
    Attendee,
    CheckInLog,
    Report,
    DashboardStat
  } = models;

  if (Organization) await Organization.deleteMany({});
  if (User) await User.deleteMany({});
  if (Event) await Event.deleteMany({});
  if (TicketType) await TicketType.deleteMany({});
  if (Attendee) await Attendee.deleteMany({});
  if (CheckInLog) await CheckInLog.deleteMany({});
  if (Report) await Report.deleteMany({});
  if (DashboardStat) await DashboardStat.deleteMany({});

  if (Organization) await Organization.insertMany(organizations);
  if (User) await User.insertMany(users);
  if (Event) await Event.insertMany(events);
  if (TicketType) await TicketType.insertMany(ticketTypes);
  if (Attendee) await Attendee.insertMany(attendees);
  if (CheckInLog) await CheckInLog.insertMany(checkInLogs);
  if (Report) await Report.insertMany(reports);
  if (DashboardStat) await DashboardStat.insertOne(dashboardStats);

  return seedData;
}

module.exports = {
  seedData,
  seedDatabase,
  organizations,
  users,
  ticketTypes,
  events,
  attendees,
  checkInLogs,
  reports,
  dashboardStats
};

if (require.main === module) {
  seedDatabase().then((result) => {
    console.log('Seed complete. Collections loaded:', Object.keys(result));
  }).catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
