import { useScan } from '../contexts/ScanContext.jsx';
import "./History.css";

function History() {
  const { checkInHistory, selectedEvent } = useScan();

  const todayCheckIns = checkInHistory.filter(ci => {
    const ciDate = new Date(ci.timestamp).toDateString();
    return ciDate === new Date().toDateString();
  });

  if (!selectedEvent) {
    return (
      <div className="history-page">
        <h1>Lịch sử quét</h1>
        <p className="history-empty">
          Vui lòng chọn sự kiện từ tab "Quét QR" để xem lịch sử
        </p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <h1>Lịch sử quét</h1>
      <p className="history-subtitle">
        {selectedEvent.name} - {todayCheckIns.length} lượt hôm nay
      </p>

      {todayCheckIns.length === 0 ? (
        <p className="history-empty">
          Chưa có lượt check-in nào. Bắt đầu quét QR từ tab "Quét QR".
        </p>
      ) : (
        <div className="history-list">
          {todayCheckIns.map((checkIn, idx) => (
            <div key={checkIn.id} className="history-item">
              <div className="history-index">{todayCheckIns.length - idx}</div>
              <div className="history-content">
                <p className="history-attendee">
                  Người tham dự #{checkIn.attendeeId}
                </p>
                <p className="history-time">
                  {new Date(checkIn.timestamp).toLocaleTimeString('vi-VN')}
                </p>
              </div>
              <div className={`history-method ${checkIn.method}`}>
                {checkIn.method === 'qr_scan' ? '🔍 QR' : '👆 Thủ công'}
              </div>
              <div className="history-status">
                {checkIn.synced ? '✓ Đã đồng bộ' : '⏳ Đang chờ'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
