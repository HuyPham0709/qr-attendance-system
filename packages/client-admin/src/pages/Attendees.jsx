import { useState } from 'react';
import { Search, Upload, Download, Plus, Filter, ChevronDown, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { MOCK_ATTENDEES } from "../constants/mockData.js";

const statusConfig = {
  checked_in: { label: 'Đã check-in', color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle2 },
  registered: { label: 'Đã đăng ký', color: '#0891B2', bg: '#ECFEFF', icon: Clock },
  cancelled: { label: 'Hủy bỏ', color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  no_show: { label: 'Vắng mặt', color: '#D97706', bg: '#FFFBEB', icon: AlertCircle }
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

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: '#0F172A', letterSpacing: '-0.02em' }}>
              Người tham dự
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              {total.toLocaleString()} tổng · {checkedIn.toLocaleString()} đã check-in
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
              <Upload size={14} /> Import
            </button>
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
              <Download size={14} /> Xuất
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
              <Plus size={14} /> Thêm
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Tổng số', value: total, color: '#0F172A' },
            { label: 'Đã check-in', value: checkedIn, color: '#16A34A' },
            { label: 'Chờ xác nhận', value: registered, color: '#0891B2' },
            { label: 'Vắng mặt', value: noShow, color: '#D97706' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                {stat.label}
              </div>
              <strong style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search size={15} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8'
            }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                paddingLeft: '32px',
                paddingRight: '12px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none'
              }}
            />
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 500,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#64748B'
          }}>
            <Filter size={13} /> Lọc
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Họ tên</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sự kiện</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Loại vé</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((attendee, idx) => {
              const status = statusConfig[attendee.status] || statusConfig.registered;
              const StatusIcon = status.icon;
              return (
                <tr key={attendee.id} style={{
                  borderTop: '1px solid #F1F5F9',
                  transition: 'background 160ms ease'
                }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FBFF'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {attendee.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', margin: 0 }}>{attendee.name}</p>
                        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{attendee.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748B' }}>{attendee.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748B' }}>{attendee.eventName}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: attendee.ticketType === 'VIP' ? '#F5F3FF' : attendee.ticketType === 'Partner' ? '#FFF7ED' : '#F8FAFC',
                      color: attendee.ticketType === 'VIP' ? '#7C3AED' : attendee.ticketType === 'Partner' ? '#EA580C' : '#64748B'
                    }}>
                      {attendee.ticketType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '12px',
                      background: status.bg,
                      color: status.color,
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      <StatusIcon size={12} /> {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Attendees;
