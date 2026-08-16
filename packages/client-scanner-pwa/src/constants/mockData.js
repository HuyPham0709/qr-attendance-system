const buildTodayTimestamp = (hour, minute) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const MOCK_SCANNER_EVENTS = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f801',
    id: '64d8b9c2f1a2b3c4d5e6f801',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'Tech Conference 2024',
    slug: 'tech-conference-2024',
    description: 'Hội nghị công nghệ dành cho đội ngũ kỹ thuật và quản lý.',
    location: {
      address: 'Hanoi Convention Center, Vietnam',
      geo: { lat: 21.0285, lng: 105.8542 },
      geoFenceRadiusMeters: 200
    },
    startAt: '2024-12-15T08:00:00.000Z',
    endAt: '2024-12-15T17:00:00.000Z',
    status: 'published',
    gates: [
      { name: 'Gate A', code: 'GA001' },
      { name: 'Gate B', code: 'GB001' }
    ],
    stats: {
      totalRegistered: 250,
      checkedInToday: 180,
      noShow: 42
    },
    isActive: true,
    assignedUsers: ['64d8b9c2f1a2b3c4d5e6f711'],
    createdAt: '2024-11-01T00:00:00.000Z',
    updatedAt: '2024-11-10T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f802',
    id: '64d8b9c2f1a2b3c4d5e6f802',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'Summer Networking Event',
    slug: 'summer-networking-event',
    description: 'Buổi networking và đối thoại doanh nghiệp/khởi nghiệp.',
    location: {
      address: 'Saigon Innovation Hub, HCMC',
      geo: { lat: 10.7769, lng: 106.7009 },
      geoFenceRadiusMeters: 150
    },
    startAt: '2024-12-20T18:00:00.000Z',
    endAt: '2024-12-20T21:00:00.000Z',
    status: 'published',
    gates: [
      { name: 'Main Entrance', code: 'ME001' }
    ],
    stats: {
      totalRegistered: 120,
      checkedInToday: 95,
      noShow: 18
    },
    isActive: false,
    assignedUsers: ['64d8b9c2f1a2b3c4d5e6f711'],
    createdAt: '2024-11-05T00:00:00.000Z',
    updatedAt: '2024-11-12T00:00:00.000Z'
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f803',
    id: '64d8b9c2f1a2b3c4d5e6f803',
    organizationId: '64d8b9c2f1a2b3c4d5e6f700',
    name: 'Product Launch',
    slug: 'product-launch-2024',
    description: 'Ra mắt sản phẩm và cuộc gặp đối tác báo chí.',
    location: {
      address: 'Da Nang Central Hall',
      geo: { lat: 16.0544, lng: 108.2022 },
      geoFenceRadiusMeters: 300
    },
    startAt: '2024-12-25T10:00:00.000Z',
    endAt: '2024-12-25T16:00:00.000Z',
    status: 'draft',
    gates: [
      { name: 'VIP Entrance', code: 'VIP001' },
      { name: 'General Entrance', code: 'GEN001' }
    ],
    stats: {
      totalRegistered: 0,
      checkedInToday: 0,
      noShow: 0
    },
    isActive: false,
    assignedUsers: ['64d8b9c2f1a2b3c4d5e6f711'],
    createdAt: '2024-11-15T00:00:00.000Z',
    updatedAt: '2024-11-15T00:00:00.000Z'
  }
];

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const MOCK_CHECKIN_HISTORY = [
  {
    _id: '64d8b9c2f1a2b3c4d5e6f820',
    id: 'history-01',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1001',
    attendeeName: 'Nguyễn Thị Lan',
    gate: 'Gate A',
    method: 'qr_scan',
    result: 'success',
    timestamp: buildTodayTimestamp(8, 15),
    checkedInAt: buildTodayTimestamp(8, 15),
    synced: true,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    offlineSynced: true,
    createdAt: buildTodayTimestamp(8, 15)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f821',
    id: 'history-02',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1002',
    attendeeName: 'Trần Văn Nam',
    gate: 'Gate B',
    method: 'manual',
    result: 'success',
    timestamp: buildTodayTimestamp(8, 42),
    checkedInAt: buildTodayTimestamp(8, 42),
    synced: true,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    offlineSynced: false,
    createdAt: buildTodayTimestamp(8, 42)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f822',
    id: 'history-03',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1003',
    attendeeName: 'Phạm Minh Huy',
    gate: 'Gate A',
    method: 'qr_scan',
    result: 'success',
    timestamp: buildTodayTimestamp(9, 10),
    checkedInAt: buildTodayTimestamp(9, 10),
    synced: true,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    offlineSynced: true,
    createdAt: buildTodayTimestamp(9, 10)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f823',
    id: 'history-04',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1004',
    attendeeName: 'Lê Thị Mai',
    gate: 'Gate B',
    method: 'qr_scan',
    result: 'duplicate',
    timestamp: buildTodayTimestamp(9, 58),
    checkedInAt: buildTodayTimestamp(9, 58),
    synced: false,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    offlineSynced: false,
    createdAt: buildTodayTimestamp(9, 58)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f824',
    id: 'history-05',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1005',
    attendeeName: 'Hoàng Quốc Anh',
    gate: 'Gate A',
    method: 'manual',
    result: 'success',
    timestamp: buildTodayTimestamp(10, 20),
    checkedInAt: buildTodayTimestamp(10, 20),
    synced: true,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    offlineSynced: true,
    createdAt: buildTodayTimestamp(10, 20)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f825',
    id: 'history-06',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1006',
    attendeeName: 'Vũ Ngọc An',
    gate: 'Gate A',
    method: 'qr_scan',
    result: 'invalid',
    timestamp: buildTodayTimestamp(11, 5),
    checkedInAt: buildTodayTimestamp(11, 5),
    synced: true,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-01',
    offlineSynced: false,
    createdAt: buildTodayTimestamp(11, 5)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f826',
    id: 'history-07',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1007',
    attendeeName: 'Đặng Bảo Ngọc',
    gate: 'Gate B',
    method: 'manual',
    result: 'success',
    timestamp: buildTodayTimestamp(12, 12),
    checkedInAt: buildTodayTimestamp(12, 12),
    synced: false,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-03',
    offlineSynced: true,
    createdAt: buildTodayTimestamp(12, 12)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f827',
    id: 'history-08',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1008',
    attendeeName: 'Bùi Thanh Tùng',
    gate: 'Gate A',
    method: 'qr_scan',
    result: 'success',
    timestamp: buildTodayTimestamp(13, 32),
    checkedInAt: buildTodayTimestamp(13, 32),
    synced: true,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    offlineSynced: true,
    createdAt: buildTodayTimestamp(13, 32)
  },
  {
    _id: '64d8b9c2f1a2b3c4d5e6f828',
    id: 'history-09',
    eventId: '64d8b9c2f1a2b3c4d5e6f801',
    attendeeId: 'AT-1009',
    attendeeName: 'Lý Văn Dũng',
    gate: 'Gate B',
    method: 'manual',
    result: 'success',
    timestamp: buildTodayTimestamp(14, 5),
    checkedInAt: buildTodayTimestamp(14, 5),
    synced: true,
    scannedBy: '64d8b9c2f1a2b3c4d5e6f711',
    deviceId: 'scanner-device-02',
    offlineSynced: true,
    createdAt: buildTodayTimestamp(14, 5)
  }
];

export const CHECK_IN_STATUS = {
  success: { color: '#10b981', label: 'Thành công' },
  duplicate: { color: '#f59e0b', label: 'Trùng lặp' },
  invalid: { color: '#ef4444', label: 'Không hợp lệ' },
  expired: { color: '#ef4444', label: 'Hết hạn' }
};
