import { useState } from 'react';
import { TrendingUp, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_DASHBOARD_STATS, MOCK_EVENTS } from "../constants/mockData.js";
import "./Dashboard.css";

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
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Tổng quan</h1>
          <p className="subtitle">Thống kê hoạt động hệ thống</p>
        </div>
        <div className="period-selector">
          {periods.map((p) => (
            <button
              key={p.id}
              className={"period-btn" + (period === p.id ? " active" : "")}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-cards">
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="stat-card">
              <div className="stat-card-header">
                <div>
                  <p className="stat-card-label">{item.label}</p>
                  <p className="stat-card-value">{item.value}</p>
                </div>
                <div
                  className="stat-card-icon"
                  style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className={"stat-card-change " + (item.positive ? "positive" : "negative")}>
                <TrendingUp size={14} />
                {item.change}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Check-in theo giờ</h3>
          <p className="card-subtitle">Phân bố check-in trong ngày</p>
          <div className="hour-grid">
            {Object.entries(MOCK_DASHBOARD_STATS.checkInByHour).map(([hour, count]) => (
              <div key={hour} className="hour-item">
                <div className="hour-label">{hour}</div>
                <strong className="hour-value">{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Sự kiện gần đây</h3>
          <p className="card-subtitle">Danh sách 3 sự kiện mới nhất</p>
          <div className="event-list">
            {MOCK_EVENTS.slice(0, 3).map((event, idx) => (
              <div key={idx} className="event-item">
                <div>
                  <p className="event-item-name">{event.name}</p>
                  <p className="event-item-meta">{event.status}</p>
                </div>
                <span className="event-item-stat">
                  {event.stats.totalCheckedIn}/{event.stats.totalRegistered}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
