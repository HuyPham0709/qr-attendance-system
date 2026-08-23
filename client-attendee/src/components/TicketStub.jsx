import { Calendar, MapPin, Download, RefreshCw, CheckCircle2 } from "lucide-react";
import "./TicketStub.css";

function formatDateTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

/**
 * Thẻ vé — hình dạng như 1 tấm vé sự kiện thật: nửa trái là thông tin,
 * nửa phải là mã QR, ở giữa là đường "xé vé" (perforation) với 2 vết
 * khuyết bán nguyệt ở mép trên/dưới. Đây là điểm nhấn thị giác chính của
 * toàn bộ trang Attendee — vì đây đúng là thứ người dùng thực sự nhận
 * được sau khi đăng ký.
 */
function TicketStub({ ticket, onResend, resending }) {
  const { fullName, event, ticketType, qrDataUrl, isCheckedIn, status } = ticket;

  return (
    <div className="ticket-stub">
      <div className="ticket-stub-info">
        <span className="ticket-stub-eyebrow">{ticketType?.name || "Vé tham dự"}</span>
        <h3 className="ticket-stub-event">{event?.name}</h3>
        <p className="ticket-stub-holder">{fullName}</p>

        <div className="ticket-stub-meta">
          {event?.startAt && (
            <span>
              <Calendar size={14} strokeWidth={2} /> {formatDateTime(event.startAt)}
            </span>
          )}
          {event?.address && (
            <span>
              <MapPin size={14} strokeWidth={2} /> {event.address}
            </span>
          )}
        </div>

        <div className="ticket-stub-status">
          {status === "cancelled" ? (
            <span className="ticket-badge ticket-badge-cancelled">Vé đã bị huỷ</span>
          ) : isCheckedIn ? (
            <span className="ticket-badge ticket-badge-checked">
              <CheckCircle2 size={13} strokeWidth={2.3} /> Đã check-in
            </span>
          ) : (
            <span className="ticket-badge ticket-badge-pending">Chưa check-in</span>
          )}
        </div>
      </div>

      <div className="ticket-stub-perforation" aria-hidden="true">
        <span className="ticket-notch ticket-notch-top" />
        <span className="ticket-notch ticket-notch-bottom" />
      </div>

      <div className="ticket-stub-qr">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`Mã QR check-in của ${fullName}`} />
        ) : (
          <div className="ticket-stub-qr-placeholder">Không có QR</div>
        )}
        <div className="ticket-stub-actions">
          {qrDataUrl && (
            <a
              className="ticket-stub-action"
              href={qrDataUrl}
              download={`ve-${(event?.name || "su-kien").replace(/\s+/g, "-").toLowerCase()}.png`}
              title="Tải ảnh QR"
            >
              <Download size={15} strokeWidth={2.2} />
            </a>
          )}
          {onResend && status !== "cancelled" && (
            <button
              className="ticket-stub-action"
              type="button"
              onClick={onResend}
              disabled={resending}
              title="Gửi lại email QR"
            >
              <RefreshCw size={15} strokeWidth={2.2} className={resending ? "spin" : ""} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketStub;
