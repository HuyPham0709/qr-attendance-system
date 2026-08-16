import { useState } from 'react';
import { Search, Upload, Download, Plus, Filter, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { MOCK_ATTENDEES } from "../constants/mockData.js";
import "./Attendees.css";

const statusConfig = {
  checked_in: { label: 'Đã check-in', color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle2, className: 'status-success' },
  registered: { label: 'Đã đăng ký', color: '#0891B2', bg: '#ECFEFF', icon: Clock, className: 'status-registered' },
  cancelled: { label: 'Hủy bỏ', color: '#DC2626', bg: '#FEF2F2', icon: XCircle, className: 'status-cancelled' },
  no_show: { label: 'Vắng mặt', color: '#D97706', bg: '#FFFBEB', icon: AlertCircle, className: 'status-no-show' }
};

function Attendees() {
  const [search, setSearch] = useState('');
  const total = MOCK_ATTENDEES.length;
  const checkedIn = MOCK_ATTENDEES.filter((a) => a.status === 'checked_in').length;
  const registered = MOCK_ATTENDEES.filter((a) => a.status === 'registered').length;
  const noShow = MOCK_ATTENDEES.filter((a) => a.status === 'no_show').length;

  const filtered = MOCK_ATTENDEES.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search)
  );

  const getTicketClass = (type) => {
    if (type === 'VIP') return 'ticket-badge vip';
    if (type === 'Partner') return 'ticket-badge partner';
    return 'ticket-badge standard';
  };

  return (
    <div className="attendees-page">
      <div className="attendees-header">
        <div>
          <h1>Người tham dự</h1>
          <p className="subtitle">
            {total.toLocaleString()} tổng · {checkedIn.toLocaleString()} đã check-in
          </p>
        </div>
        <div className="attendees-actions">
          <button className="btn" type="button">
            <Upload size={14} /> Import
          </button>
          <button className="btn" type="button">
            <Download size={14} /> Xuất
          </button>
          <button className="btn btn-primary" type="button">
            <Plus size={14} /> Thêm
          </button>
        </div>
      </div>

      <div className="attendees-stats">
        {[
          { label: 'Tổng số', value: total, color: 'var(--text-primary)' },
          { label: 'Đã check-in', value: checkedIn, color: 'var(--success-500)' },
          { label: 'Chờ xác nhận', value: registered, color: 'var(--info-500)' },
          { label: 'Vắng mặt', value: noShow, color: 'var(--warning-500)' }
        ].map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-card-label">{stat.label}</div>
            <strong className="stat-card-value" style={{ color: stat.color }}>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="attendees-table-wrap">
        <div className="attendees-toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn" type="button">
            <Filter size={13} /> Lọc
          </button>
        </div>

        <table className="attendees-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Sự kiện</th>
              <th>Loại vé</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((attendee) => {
              const status = statusConfig[attendee.status] || statusConfig.registered;
              const StatusIcon = status.icon;
              return (
                <tr key={attendee.id}>
                  <td>
                    <div className="attendee-cell">
                      <span className="attendee-avatar">
                        {attendee.name.charAt(0)}
                      </span>
                      <div>
                        <p className="attendee-name">{attendee.name}</p>
                        <p className="attendee-phone">{attendee.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td>{attendee.email}</td>
                  <td>{attendee.eventName}</td>
                  <td>
                    <span className={getTicketClass(attendee.ticketType)}>
                      {attendee.ticketType}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ background: status.bg, color: status.color }}
                    >
                      <StatusIcon size={12} /> {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>Không tìm thấy người tham dự phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Attendees;
