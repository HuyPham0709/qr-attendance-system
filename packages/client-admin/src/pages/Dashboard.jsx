import { useState } from 'react';
import { TrendingUp, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_DASHBOARD_STATS, MOCK_EVENTS } from "../constants/mockData.js";

function Dashboard() {
  const [period, setPeriod] = useState('7d');

  const periods = [
    { id: 'today', label: 'Hôm nay' },
    { id: '7d', label: '7 ngày' },
    { id: '30d', label: '30 ngày' },
    { id: 'custom', label: 'Tuỳ chỉnh' },
  ];

  const statCards = [
    {
      label: 'Tổng đăng ký',
      value: MOCK_DASHBOARD_STATS.totalRegistered.toLocaleString(),
      change: '+12% so với tháng trước',
      positive: true,
      icon: Users,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB'
    },
    {
      label: 'Check-in',
      value: MOCK_DASHBOARD_STATS.totalAttendance.toLocaleString(),
      change: '+8.2% tỷ lệ tham dự',
      positive: true,
      icon: CheckCircle2,
      iconBg: '#F0FDF4',
      iconColor: '#16A34A'
    },
    {
      label: 'Tỷ lệ chuyển đổi',
      value: `${MOCK_DASHBOARD_STATS.conversionRate}%`,
      change: '+3.1% so với trung bình',
      positive: true,
      icon: TrendingUp,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED'
    },
    {
      label: 'No-show',
      value: MOCK_DASHBOARD_STATS.totalNoShow.toLocaleString(),
      change: '21.8% tổng số',
      positive: false,
      icon: AlertCircle,
      iconBg: '#FFFBEB',
      iconColor: '#D97706'
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Tổng quan
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Thống kê hoạt động hệ thống
          </p>
        </div>
        <div style={{
          display: 'flex',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden'
        }}>
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: period === p.id ? '#2563EB' : 'transparent',
                color: period === p.id ? '#FFFFFF' : '#64748B',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 160ms ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '120px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', margin: '0 0 6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
                    {item.value}
                  </p>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: item.iconBg,
                    color: item.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '12px', fontWeight: 500, color: item.positive ? '#16A34A' : '#D97706' }}>
                <TrendingUp size={14} />
                {item.change}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#0F172A' }}>Check-in theo giờ</h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px' }}>Phân bố check-in trong ngày</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '8px' }}>
            {Object.entries(MOCK_DASHBOARD_STATS.checkInByHour).map(([hour, count]) => (
              <div key={hour} style={{
                background: '#F8FAFC',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center',
                border: '1px solid #F1F5F9'
              }}>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{hour}</div>
                <strong style={{ fontSize: '16px', color: '#0F172A', display: 'block', lineHeight: 1.2 }}>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#0F172A' }}>Sự kiện gần đây</h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px' }}>Danh sách 3 sự kiện mới nhất</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_EVENTS.slice(0, 3).map((event, idx) => (
              <div key={idx} style={{
                padding: '10px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px'
              }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#0F172A', margin: '0 0 2px' }}>{event.name}</p>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{event.status}</p>
                </div>
                <span style={{ fontWeight: 600, color: '#2563EB' }}>{event.stats.totalCheckedIn}/{event.stats.totalRegistered}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
