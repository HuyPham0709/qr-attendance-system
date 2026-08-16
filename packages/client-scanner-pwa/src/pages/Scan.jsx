import { useState } from 'react';
import { useScan } from '../contexts/ScanContext';
import "./Scan.css";

function Scan() {
  const { assignedEvents, selectedEvent, selectEvent, recordCheckIn } = useScan();
  const [lastCheckIn, setLastCheckIn] = useState(null);

  const handleEventSelect = (eventId) => {
    selectEvent(eventId);
  };

  const handleManualCheckIn = () => {
    if (!selectedEvent) {
      alert('Vui lòng chọn sự kiện trước');
      return;
    }
    // Mock manual check-in
    const mockAttendeeId = 'ATT' + Math.random().toString(36).substr(2, 9);
    const checkIn = recordCheckIn(mockAttendeeId, 'manual');
    setLastCheckIn({
      ...checkIn,
      result: 'success',
      attendeeName: 'John Doe'
    });
    
    // Tự động xóa kết quả sau 3 giây
    setTimeout(() => setLastCheckIn(null), 3000);
  };

  if (assignedEvents.length === 0) {
    return (
      <div className="scan-page empty">
        <p>Không có sự kiện nào được gán cho bạn</p>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="scan-page event-selector">
        <h2>Chọn sự kiện để bắt đầu quét</h2>
        <div className="event-list">
          {assignedEvents.map(event => (
            <button
              key={event.id}
              className="event-button"
              onClick={() => handleEventSelect(event.id)}
            >
              <strong>{event.name}</strong>
              <span>{event.location?.address || event.location || 'Không xác định'}</span>
              <span className="event-time">
                {new Date(event.startAt).toLocaleDateString('vi-VN')}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="scan-page">
      <div className="viewfinder">
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />
        <p className="viewfinder-hint">Camera chưa được kết nối (Tuần 5)</p>
      </div>

      {lastCheckIn && (
        <div className={`scan-result ${lastCheckIn.result}`}>
          <p className="result-status">
            {lastCheckIn.result === 'success' ? '✓ Thành công' : '✗ Lỗi'}
          </p>
          <p className="result-name">{lastCheckIn.attendeeName}</p>
          <p className="result-time">
            {new Date(lastCheckIn.timestamp).toLocaleTimeString('vi-VN')}
          </p>
        </div>
      )}

      <div className="scan-result-placeholder">
        <p>
          Kết quả quét (thành công / trùng / lỗi) sẽ hiển thị ở đây, kèm
          rung/âm thanh phản hồi.
        </p>
        <span className="scan-note">
          Tuần 5 · nối camera thật bằng html5-qrcode
        </span>
      </div>

      <button
        type="button"
        className="manual-checkin-btn"
        onClick={handleManualCheckIn}
      >
        Check-in thủ công
      </button>
    </div>
  );
}

export default Scan;
