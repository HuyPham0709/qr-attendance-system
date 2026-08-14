import "./Scan.css";

function Scan() {
  return (
    <div className="scan-page">
      <div className="viewfinder">
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />
        <p className="viewfinder-hint">Camera chưa được kết nối</p>
      </div>

      <div className="scan-result-placeholder">
        <p>
          Kết quả quét (thành công / trùng / lỗi) sẽ hiển thị ở đây, kèm
          rung/âm thanh phản hồi.
        </p>
        <span className="scan-note">
          Tuần 5 · nối camera thật bằng html5-qrcode
        </span>
      </div>

      <button type="button" className="manual-checkin-btn" disabled>
        Check-in thủ công
      </button>
    </div>
  );
}

export default Scan;
