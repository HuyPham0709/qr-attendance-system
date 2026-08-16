import { Download, FileText } from 'lucide-react';
import { MOCK_REPORTS } from "../constants/mockData.js";

function Reports() {
  const kpiCards = [
    { label: 'Tổng đăng ký', value: '2,400', sub: '100%', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Tổng check-in', value: '1,876', sub: '78.2%', color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Tỷ lệ check-in', value: '78.2%', sub: '+3.1% vs trung bình', color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'No-show', value: '524', sub: '21.8%', color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Báo cáo
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Tech Summit Vietnam 2026 · 16 Aug 2026
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#64748B',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 160ms ease'
          }}>
            <FileText size={14} /> Export PDF
          </button>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#2563EB',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 160ms ease'
          }}>
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpiCards.map((card, idx) => (
          <div key={idx} style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {card.label}
            </p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              {card.value}
            </p>
            <span style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: card.bg,
              color: card.color,
              padding: '4px 8px',
              borderRadius: '6px'
            }}>
              {card.sub}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>Check-in theo cổng</h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px' }}>Tổng check-in tại mỗi cổng</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { gate: 'Gate A', count: 1240, color: '#2563EB' },
              { gate: 'Gate B', count: 450, color: '#0891B2' },
              { gate: 'Gate C', count: 186, color: '#16A34A' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: idx < 2 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{item.gate}</span>
                <strong style={{ fontSize: '14px', color: item.color }}>{item.count}</strong>
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
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>Phân bố loại vé</h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px' }}>Breakdown theo loại vé</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { ticket: 'General', count: 2150, percentage: 89.6, color: '#2563EB' },
              { ticket: 'VIP', count: 190, percentage: 7.9, color: '#7C3AED' },
              { ticket: 'Speaker', count: 60, percentage: 2.5, color: '#EA580C' }
            ].map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{item.ticket}</span>
                  </div>
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>{item.count.toLocaleString()}</strong>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {MOCK_REPORTS.slice(0, 2).map((report, idx) => (
        <div key={idx} style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {report.id}
              </p>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{report.eventName}</h3>
            </div>
            <div style={{ fontWeight: 700, fontSize: '24px', color: '#2563EB' }}>{report.attendanceRate}%</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 500 }}>Đăng ký</div>
              <strong style={{ fontSize: '20px', color: '#0F172A', display: 'block' }}>{report.totalRegistered}</strong>
            </div>
            <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#16A34A', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 500 }}>Check-in</div>
              <strong style={{ fontSize: '20px', color: '#16A34A', display: 'block' }}>{report.totalCheckedIn}</strong>
            </div>
            <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#D97706', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 500 }}>No-show</div>
              <strong style={{ fontSize: '20px', color: '#D97706', display: 'block' }}>{Math.round(report.totalRegistered * (1 - report.attendanceRate / 100))}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', margin: '0 0 8px' }}>Theo cổng</h4>
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#64748B', fontSize: '12px' }}>
                {Object.entries(report.gateBreakdown).slice(0, 3).map(([gate, count]) => (
                  <li key={gate} style={{ marginBottom: '4px' }}>
                    {gate}: <strong style={{ color: '#0F172A' }}>{count}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', margin: '0 0 8px' }}>Theo giờ (Top)</h4>
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#64748B', fontSize: '12px' }}>
                {Object.entries(report.byHour).slice(0, 3).map(([hour, count]) => (
                  <li key={hour} style={{ marginBottom: '4px' }}>
                    {hour}: <strong style={{ color: '#0F172A' }}>{count}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default Reports;
