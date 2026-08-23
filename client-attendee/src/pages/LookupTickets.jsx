import { useState } from "react";
import { Search, MailX } from "lucide-react";
import TicketStub from "../components/TicketStub.jsx";
import { attendeeApi, describeApiError } from "../api.js";
import "./LookupTickets.css";

function LookupTickets() {
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [resendNotice, setResendNotice] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setResendNotice(null);
    try {
      const data = await attendeeApi.lookup(email.trim().toLowerCase());
      setTickets(data);
    } catch (err) {
      setError(describeApiError(err).message);
      setTickets(null);
    } finally {
      setSearching(false);
    }
  }

  async function handleResend(attendeeId, holderEmail) {
    setResendingId(attendeeId);
    setResendNotice(null);
    try {
      const data = await attendeeApi.resend(attendeeId);
      setResendNotice({
        type: data.emailSent ? "success" : "info",
        text: data.emailSent
          ? `Đã gửi lại email chứa mã QR tới ${holderEmail}.`
          : "Chưa gửi được email tự động ngay lúc này — bạn vẫn có thể tải ảnh QR trực tiếp từ tấm vé bên dưới."
      });
    } catch (err) {
      setResendNotice({ type: "error", text: describeApiError(err).message });
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div>
      <div className="page-intro">
        <h1>Tra cứu vé của bạn</h1>
        <p>Nhập email đã dùng khi đăng ký để xem lại vé và mã QR check-in.</p>
      </div>

      <form className="lookup-form" onSubmit={handleSearch}>
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
          <input
            type="email"
            required
            placeholder="ban@vidu.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={searching}>
          <Search size={16} strokeWidth={2.3} />
          {searching ? "Đang tìm..." : "Tra cứu"}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {resendNotice && (
        <div
          className={`alert ${
            resendNotice.type === "success"
              ? "alert-success"
              : resendNotice.type === "error"
                ? "alert-error"
                : "alert-info"
          }`}
        >
          {resendNotice.text}
        </div>
      )}

      {tickets?.length === 0 && (
        <div className="empty-state">
          <MailX size={28} strokeWidth={1.8} />
          <p>Không tìm thấy vé nào được đăng ký bằng email này.</p>
        </div>
      )}

      {tickets?.map((ticket) => (
        <TicketStub
          key={ticket.id}
          ticket={ticket}
          onResend={() => handleResend(ticket.id, ticket.email)}
          resending={resendingId === ticket.id}
        />
      ))}
    </div>
  );
}

export default LookupTickets;
