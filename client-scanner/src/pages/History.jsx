import "./History.css";

function History() {
  return (
    <div className="history-page">
      <h1>Lịch sử quét</h1>
      <p className="history-empty">
        Danh sách lượt quét gần đây (API /checkin/logs) sẽ hiển thị ở đây —
        Tuần 5.
      </p>
    </div>
  );
}

export default History;
