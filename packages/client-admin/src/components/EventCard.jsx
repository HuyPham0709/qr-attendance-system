import { Calendar, MapPin, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/mockData.js';
import './EventCard.css';

export default function EventCard({ event }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const checkInRate = event.stats.totalRegistered > 0
    ? Math.round((event.stats.totalCheckedIn / event.stats.totalRegistered) * 100)
    : 0;

  return (
    <div className="event-card">
      <div className="event-card-header">
        <h3>{event.name}</h3>
        <span
          className="event-status"
          style={{ backgroundColor: STATUS_COLORS[event.status] }}
        >
          {STATUS_LABELS[event.status]}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-info-row">
          <Calendar size={16} />
          <span>
            {formatDate(event.startAt)} · {formatTime(event.startAt)} - {formatTime(event.endAt)}
          </span>
        </div>

        <div className="event-info-row">
          <MapPin size={16} />
          <span>{event.location.address}</span>
        </div>

        <div className="event-stats">
          <div className="stat">
            <span className="stat-label">Đã đăng ký</span>
            <span className="stat-value">{event.stats.totalRegistered}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Đã check-in</span>
            <span className="stat-value">{event.stats.totalCheckedIn}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Tỷ lệ</span>
            <span className="stat-value">{checkInRate}%</span>
          </div>
        </div>

        <div className="event-gates">
          <span className="gate-label">Cổng:</span>
          {event.gates.map((gate) => (
            <span key={gate.code} className="gate-badge">
              {gate.name}
            </span>
          ))}
        </div>
      </div>

      <div className="event-card-footer">
        <button className="btn-icon" title="Xem chi tiết">
          <Eye size={16} />
        </button>
        <button className="btn-icon" title="Chỉnh sửa">
          <Edit size={16} />
        </button>
        <button className="btn-icon btn-danger" title="Xóa">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
