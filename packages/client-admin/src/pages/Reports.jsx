import { Download, FileText } from 'lucide-react';
import { MOCK_REPORTS } from "../constants/mockData.js";
import "./Reports.css";

function Reports() {
  const kpiCards = [
    { label: 'Tổng đăng ký', value: '2,400', sub: '100%', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Tổng check-in', value: '1,876', sub: '78.2%', color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Tỷ lệ check-in', value: '78.2%', sub: '+3.1% vs trung bình', color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'No-show', value: '524', sub: '21.8%', color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Báo cáo</h1>
          <p className="subtitle">Tech Summit Vietnam 2026 · 16 Aug 2026</p>
        </div>
        <div className="reports-actions">
          <button className="btn" type="button">
            <FileText size={14} /> Export PDF
          </button>
          <button className="btn btn-primary" type="button">
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="kpi-card">
            <p className="kpi-label">{card.label}</p>
            <p className="kpi-value">{card.value}</p>
            <span className="kpi-badge" style={{ backgroundColor: card.bg, color: card.color }}>
              {card.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h3>Check-in theo cổng</h3>
          <p className="card-subtitle">Tổng check-in tại mỗi cổng</p>
          <div className="gate-list">
            {[
              { gate: 'Gate A', count: 1240, color: '#2563EB' },
              { gate: 'Gate B', count: 450, color: '#0891B2' },
              { gate: 'Gate C', count: 186, color: '#16A34A' }
            ].map((item, idx) => (
              <div key={idx} className={"gate-item" + (idx < 2 ? " has-border" : "")}>
                <span className="gate-name">{item.gate}</span>
                <strong className="gate-count" style={{ color: item.color }}>{item.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="report-card">
          <h3>Phân bố loại vé</h3>
          <p className="card-subtitle">Breakdown theo loại vé</p>
          <div className="ticket-list">
            {[
              { ticket: 'General', count: 2150, percentage: 89.6, color: '#2563EB' },
              { ticket: 'VIP', count: 190, percentage: 7.9, color: '#7C3AED' },
              { ticket: 'Speaker', count: 60, percentage: 2.5, color: '#EA580C' }
            ].map((item, idx) => (
              <div key={idx} className="ticket-item">
                <div className="ticket-header">
                  <div className="ticket-name">
                    <span className="ticket-dot" style={{ backgroundColor: item.color }} />
                    {item.ticket}
                  </div>
                  <strong className="ticket-count">{item.count.toLocaleString()}</strong>
                </div>
                <div className="ticket-bar-bg">
                  <div
                    className="ticket-bar-fill"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {MOCK_REPORTS.slice(0, 2).map((report, idx) => (
        <div key={idx} className="report-detail">
          <div className="report-detail-header">
            <div>
              <p className="report-id">{report.id}</p>
              <h3 className="report-title">{report.eventName}</h3>
            </div>
            <div className="report-rate">{report.attendanceRate}%</div>
          </div>

          <div className="report-mini-grid">
            <div className="report-mini-card" style={{ background: '#F8FAFC' }}>
              <div className="report-mini-label">Đăng ký</div>
              <strong className="report-mini-value">{report.totalRegistered}</strong>
            </div>
            <div className="report-mini-card" style={{ background: '#F0FDF4' }}>
              <div className="report-mini-label" style={{ color: 'var(--success-500)' }}>Check-in</div>
              <strong className="report-mini-value" style={{ color: 'var(--success-500)' }}>{report.totalCheckedIn}</strong>
            </div>
            <div className="report-mini-card" style={{ background: '#FFFBEB' }}>
              <div className="report-mini-label" style={{ color: 'var(--warning-500)' }}>No-show</div>
              <strong className="report-mini-value" style={{ color: 'var(--warning-500)' }}>
                {Math.round(report.totalRegistered * (1 - report.attendanceRate / 100))}
              </strong>
            </div>
          </div>

          <div className="report-breakdown">
            <div>
              <h4>Theo cổng</h4>
              <ul>
                {Object.entries(report.gateBreakdown).slice(0, 3).map(([gate, count]) => (
                  <li key={gate}>
                    {gate}: <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Theo giờ (Top)</h4>
              <ul>
                {Object.entries(report.byHour).slice(0, 3).map(([hour, count]) => (
                  <li key={hour}>
                    {hour}: <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Reports;
