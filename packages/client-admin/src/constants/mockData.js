export const ORGANIZATION = {
  _id: '64d8b9c2f1a2b3c4d5e6f700',
  name: 'QR Attendance Labs',
  slug: 'qr-attendance-labs',
  email: 'hello@qra.tt',
  phone: '+84 912 345 678',
  address: 'Hanoi, Vietnam',
  website: 'https://qra.tt',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

export const MOCK_USERS = [
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

export const MOCK_EVENTS = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f701',
    id: '64d8b9c2f1a2b3c4d5e6f701',
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
      totalCheckedIn: 180
    },
    createdAt: '2024-11-01T00:00:00.000Z',
    updatedAt: '2024-11-10T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f702',
    id: '64d8b9c2f1a2b3c4d5e6f702',
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
      totalCheckedIn: 95
    },
    createdAt: '2024-11-05T00:00:00.000Z',
    updatedAt: '2024-11-12T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f703',
    id: '64d8b9c2f1a2b3c4d5e6f703',
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
      totalCheckedIn: 0
    },
    createdAt: '2024-11-15T00:00:00.000Z',
    updatedAt: '2024-11-15T00:00:00.000Z'
  }
];

export const MOCK_ATTENDEES = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f720',
    id: '64d8b9c2f1a2b3c4d5e6f720',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f740',
    fullName: 'Nguyễn Thị Lan',
    name: 'Nguyễn Thị Lan',
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
    version: 1,
    customFields: {
      registrationSource: 'Website',
      ticketType: 'VIP',
      eventName: 'Tech Conference 2024'
    },
    eventName: 'Tech Conference 2024',
    ticketType: 'VIP',
    gate: 'Gate A',
    checkInAt: '2024-12-15T09:15:00.000Z',
    registrationSource: 'Website',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-11-20T00:00:00.000Z',
    updatedAt: '2024-12-15T09:15:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f721',
    id: '64d8b9c2f1a2b3c4d5e6f721',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f741',
    fullName: 'Trần Văn Nam',
    name: 'Trần Văn Nam',
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
    version: 0,
    customFields: {
      registrationSource: 'Email Campaign',
      ticketType: 'Standard',
      eventName: 'Tech Conference 2024'
    },
    eventName: 'Tech Conference 2024',
    ticketType: 'Standard',
    gate: 'Gate B',
    checkInAt: null,
    registrationSource: 'Email Campaign',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-11-22T00:00:00.000Z',
    updatedAt: '2024-11-22T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f722',
    id: '64d8b9c2f1a2b3c4d5e6f722',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f742',
    fullName: 'Phạm Minh Huy',
    name: 'Phạm Minh Huy',
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
    version: 1,
    customFields: {
      registrationSource: 'Referral',
      ticketType: 'Partner',
      eventName: 'Summer Networking Event'
    },
    eventName: 'Summer Networking Event',
    ticketType: 'Partner',
    gate: 'Main Entrance',
    checkInAt: '2024-12-20T18:30:00.000Z',
    registrationSource: 'Referral',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-11-26T00:00:00.000Z',
    updatedAt: '2024-12-20T18:30:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f723',
    id: '64d8b9c2f1a2b3c4d5e6f723',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f741',
    fullName: 'Lê Thị Mai',
    name: 'Lê Thị Mai',
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
    version: 1,
    customFields: {
      registrationSource: 'Landing Page',
      ticketType: 'Standard',
      eventName: 'Summer Networking Event'
    },
    eventName: 'Summer Networking Event',
    ticketType: 'Standard',
    gate: 'Main Entrance',
    checkInAt: '2024-12-20T18:42:00.000Z',
    registrationSource: 'Landing Page',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-11-28T00:00:00.000Z',
    updatedAt: '2024-12-20T18:42:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f724',
    id: '64d8b9c2f1a2b3c4d5e6f724',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f740',
    fullName: 'Hoàng Quốc Anh',
    name: 'Hoàng Quốc Anh',
    email: 'anh.hoang@example.com',
    phone: '0965432198',
    qrCode: 'qr_attendee_005',
    qrSecret: 'secret_005',
    qrVersion: 1,
    status: 'cancelled',
    checkIn: {
      isCheckedIn: false,
      checkInAt: null,
      checkInBy: null,
      gate: null,
      method: null,
      deviceInfo: null
    },
    version: 0,
    customFields: {
      registrationSource: 'Partner Portal',
      ticketType: 'VIP',
      eventName: 'Summer Networking Event'
    },
    eventName: 'Summer Networking Event',
    ticketType: 'VIP',
    gate: 'Main Entrance',
    checkInAt: null,
    registrationSource: 'Partner Portal',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-11-29T00:00:00.000Z',
    updatedAt: '2024-11-29T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f725',
    id: '64d8b9c2f1a2b3c4d5e6f725',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f741',
    fullName: 'Vũ Ngọc An',
    name: 'Vũ Ngọc An',
    email: 'an.vu@example.com',
    phone: '0987654321',
    qrCode: 'qr_attendee_006',
    qrSecret: 'secret_006',
    qrVersion: 1,
    status: 'no_show',
    checkIn: {
      isCheckedIn: false,
      checkInAt: null,
      checkInBy: null,
      gate: null,
      method: null,
      deviceInfo: null
    },
    version: 0,
    customFields: {
      registrationSource: 'Social Media',
      ticketType: 'Standard',
      eventName: 'Tech Conference 2024'
    },
    eventName: 'Tech Conference 2024',
    ticketType: 'Standard',
    gate: 'Gate A',
    checkInAt: null,
    registrationSource: 'Social Media',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-11-30T00:00:00.000Z',
    updatedAt: '2024-11-30T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f726',
    id: '64d8b9c2f1a2b3c4d5e6f726',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f740',
    fullName: 'Đặng Bảo Ngọc',
    name: 'Đặng Bảo Ngọc',
    email: 'ngoc.dang@example.com',
    phone: '0909988776',
    qrCode: 'qr_attendee_007',
    qrSecret: 'secret_007',
    qrVersion: 1,
    status: 'checked_in',
    checkIn: {
      isCheckedIn: true,
      checkInAt: '2024-12-15T10:05:00.000Z',
      checkInBy: '64d8b9c2f1a2b3c4d5e6f711',
      gate: 'Gate B',
      method: 'qr_scan',
      deviceInfo: 'scanner-device-01'
    },
    version: 1,
    customFields: {
      registrationSource: 'Event Page',
      ticketType: 'VIP',
      eventName: 'Tech Conference 2024'
    },
    eventName: 'Tech Conference 2024',
    ticketType: 'VIP',
    gate: 'Gate B',
    checkInAt: '2024-12-15T10:05:00.000Z',
    registrationSource: 'Event Page',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-12-01T00:00:00.000Z',
    updatedAt: '2024-12-15T10:05:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f727',
    id: '64d8b9c2f1a2b3c4d5e6f727',
    eventId: '64d8b9c2f1a2b3c4d5e6f703',
    ticketTypeId: '64d8b9c2f1a2b3c4d5e6f741',
    fullName: 'Bùi Thanh Tùng',
    name: 'Bùi Thanh Tùng',
    email: 'tung.bui@example.com',
    phone: '0911223344',
    qrCode: 'qr_attendee_008',
    qrSecret: 'secret_008',
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
    version: 0,
    customFields: {
      registrationSource: 'Newsletter',
      ticketType: 'Standard',
      eventName: 'Product Launch'
    },
    eventName: 'Product Launch',
    ticketType: 'Standard',
    gate: 'General Entrance',
    checkInAt: null,
    registrationSource: 'Newsletter',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    createdAt: '2024-12-02T00:00:00.000Z',
    updatedAt: '2024-12-02T00:00:00.000Z'
  }
];

export const MOCK_TICKET_TYPES = [
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

export const MOCK_REPORTS = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f760',
    id: '64d8b9c2f1a2b3c4d5e6f760',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    eventName: 'Tech Conference 2024',
    date: '2024-12-15',
    totalRegistered: 250,
    totalCheckedIn: 180,
    attendanceRate: 72,
    gateBreakdown: {
      'Gate A': 104,
      'Gate B': 76
    },
    byHour: {
      '08:00': 18,
      '09:00': 31,
      '10:00': 42,
      '11:00': 39,
      '12:00': 28,
      '13:00': 22
    },
    topChannels: ['Website', 'Email Campaign', 'Referral'],
    summary: 'Sự kiện diễn ra đúng tiến độ với tỷ lệ check-in ổn định và dịch chuyển vào cổng chính cao hơn kế hoạch.'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f761',
    id: '64d8b9c2f1a2b3c4d5e6f761',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    eventName: 'Summer Networking Event',
    date: '2024-12-20',
    totalRegistered: 120,
    totalCheckedIn: 95,
    attendanceRate: 79,
    gateBreakdown: {
      'Main Entrance': 95
    },
    byHour: {
      '18:00': 26,
      '19:00': 35,
      '20:00': 22,
      '21:00': 12
    },
    topChannels: ['Landing Page', 'Referral', 'Partner Portal'],
    summary: 'Khán giả tập trung nhiều ở giai đoạn mở đầu, với lượng check-in cao trong 2 giờ đầu sự kiện.'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f762',
    id: '64d8b9c2f1a2b3c4d5e6f762',
    eventId: '64d8b9c2f1a2b3c4d5e6f703',
    eventName: 'Product Launch',
    date: '2024-12-25',
    totalRegistered: 0,
    totalCheckedIn: 0,
    attendanceRate: 0,
    gateBreakdown: {
      'VIP Entrance': 0,
      'General Entrance': 0
    },
    byHour: {
      '10:00': 0,
      '11:00': 0,
      '12:00': 0,
      '13:00': 0
    },
    topChannels: ['Newsletter', 'Website'],
    summary: 'Sự kiện ở trạng thái draft, chưa công bố rộng rãi nên chưa có dữ liệu check-in thực tế.'
  }
];

export const MOCK_CHECKIN_LOGS = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f780',
    id: '64d8b9c2f1a2b3c4d5e6f780',
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
    id: '64d8b9c2f1a2b3c4d5e6f781',
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
    _id: '64d8b9c2f1a2b3c4d5e6f782',
    id: '64d8b9c2f1a2b3c4d5e6f782',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f726',
    attendeeName: 'Đặng Bảo Ngọc',
    eventName: 'Tech Conference 2024',
    gate: 'Gate B',
    result: 'success',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    geo: { lat: 21.0285, lng: 105.8542 },
    offlineSynced: true,
    clientTimestamp: '2024-12-15T09:10:00.000Z',
    createdAt: '2024-12-15T09:10:00.000Z',
    checkInTime: '2024-12-15T09:10:00.000Z',
    hour: '09:00',
    method: 'QR',
    status: 'success',
    scannerName: 'Phạm Hữu Tài'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f783',
    id: '64d8b9c2f1a2b3c4d5e6f783',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f725',
    attendeeName: 'Vũ Ngọc An',
    eventName: 'Tech Conference 2024',
    gate: 'Gate A',
    result: 'duplicate',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    geo: { lat: 21.0285, lng: 105.8542 },
    offlineSynced: false,
    clientTimestamp: '2024-12-15T09:58:00.000Z',
    createdAt: '2024-12-15T09:58:00.000Z',
    checkInTime: '2024-12-15T09:58:00.000Z',
    hour: '09:00',
    method: 'QR',
    status: 'duplicate',
    scannerName: 'Nguyễn Hoài Nam'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f784',
    id: '64d8b9c2f1a2b3c4d5e6f784',
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
    id: '64d8b9c2f1a2b3c4d5e6f785',
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
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f786',
    id: '64d8b9c2f1a2b3c4d5e6f786',
    eventId: '64d8b9c2f1a2b3c4d5e6f702',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f724',
    attendeeName: 'Hoàng Quốc Anh',
    eventName: 'Summer Networking Event',
    gate: 'Main Entrance',
    result: 'invalid_qr',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    geo: { lat: 10.7769, lng: 106.7009 },
    offlineSynced: false,
    clientTimestamp: '2024-12-20T19:16:00.000Z',
    createdAt: '2024-12-20T19:16:00.000Z',
    checkInTime: '2024-12-20T19:16:00.000Z',
    hour: '19:00',
    method: 'QR',
    status: 'invalid',
    scannerName: 'Đỗ Thu Hằng'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f787',
    id: '64d8b9c2f1a2b3c4d5e6f787',
    eventId: '64d8b9c2f1a2b3c4d5e6f703',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f727',
    attendeeName: 'Bùi Thanh Tùng',
    eventName: 'Product Launch',
    gate: 'General Entrance',
    result: 'success',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-03',
    geo: { lat: 16.0544, lng: 108.2022 },
    offlineSynced: true,
    clientTimestamp: '2024-12-25T10:20:00.000Z',
    createdAt: '2024-12-25T10:20:00.000Z',
    checkInTime: '2024-12-25T10:20:00.000Z',
    hour: '10:00',
    method: 'QR',
    status: 'pending',
    scannerName: 'Trần Minh Khoa'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f788',
    id: '64d8b9c2f1a2b3c4d5e6f788',
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
    clientTimestamp: '2024-12-20T20:10:00.000Z',
    createdAt: '2024-12-20T20:10:00.000Z',
    checkInTime: '2024-12-20T20:10:00.000Z',
    hour: '20:00',
    method: 'QR',
    status: 'success',
    scannerName: 'Phạm Hữu Tài'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f789',
    id: '64d8b9c2f1a2b3c4d5e6f789',
    eventId: '64d8b9c2f1a2b3c4d5e6f701',
    attendeeId: '64d8b9c2f1a2b3c4d5e6f720',
    attendeeName: 'Nguyễn Thị Lan',
    eventName: 'Tech Conference 2024',
    gate: 'Gate A',
    result: 'success',
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    geo: { lat: 21.0285, lng: 105.8542 },
    offlineSynced: true,
    clientTimestamp: '2024-12-15T11:08:00.000Z',
    createdAt: '2024-12-15T11:08:00.000Z',
    checkInTime: '2024-12-15T11:08:00.000Z',
    hour: '11:00',
    method: 'QR',
    status: 'success',
    scannerName: 'Nguyễn Hoài Nam'
  }
];

export const MOCK_DASHBOARD_STATS = {
  eventId: '64d8b9c2f1a2b3c4d5e6f701',
  eventName: 'Tech Conference 2024',
  totalRegistered: 250,
  totalAttendance: 180,
  totalNoShow: 42,
  conversionRate: 72,
  avgCheckInPerHour: 24,
  peakHour: '10:00',
  checkInByHour: {
    '08:00': 18,
    '09:00': 31,
    '10:00': 42,
    '11:00': 39,
    '12:00': 28,
    '13:00': 22
  },
  gateSummary: {
    'Gate A': 104,
    'Gate B': 76
  },
  trend: {
    weekOverWeek: 12,
    comparedToLastEvent: 8
  },
  createdAt: '2024-12-15T00:00:00.000Z',
  updatedAt: '2024-12-15T13:00:00.000Z'
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const STATUS_COLORS = {
  draft: '#8b5cf6',
  published: '#3b82f6',
  ongoing: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444'
};

export const STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Công khai',
  ongoing: 'Đang diễn ra',
  completed: 'Kết thúc',
  cancelled: 'Hủy'
};

export const ROLES = {
  super_admin: 'Super Admin',
  organizer: 'Organizer',
  scanner_staff: 'Scanner Staff'
};
