import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, ArrowLeft, Mail } from "lucide-react";
import TicketStub from "../components/TicketStub.jsx";
import { eventsApi, ticketTypesApi, attendeeApi, describeApiError } from "../api.js";
import "./EventRegister.css";

const OPEN_STATUSES = ["published", "ongoing"];

function formatDateTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      weekday: "long",
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

function EventRegister() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", ticketTypeId: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([eventsApi.get(id), ticketTypesApi.listByEvent(id)])
      .then(([eventData, ticketTypeData]) => {
        if (cancelled) return;
        setEvent(eventData);
        setTicketTypes(Array.isArray(ticketTypeData) ? ticketTypeData : []);
      })
      .catch((err) => !cancelled && setLoadError(describeApiError(err).message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const data = await attendeeApi.register({
        eventId: id,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        ticketTypeId: form.ticketTypeId || undefined
      });
      setResult(data);
    } catch (err) {
      const desc = describeApiError(err);
      setSubmitError(desc.message);
      if (desc.fieldErrors) setFieldErrors(desc.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <div className="alert alert-error">{loadError}</div>;
  }

  if (!event) {
    return <p>Đang tải thông tin sự kiện...</p>;
  }

  if (result) {
    return (
      <div>
        <div className="page-intro">
          <h1>Đăng ký thành công 🎉</h1>
          <p>Đây là vé của bạn — xuất trình mã QR này tại cổng vào để check-in.</p>
        </div>

        <div className={`alert ${result.emailSent ? "alert-success" : "alert-info"}`}>
          <Mail size={14} strokeWidth={2.2} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          {result.emailSent
            ? `Đã gửi email chứa mã QR tới ${form.email}.`
            : "Chưa gửi được email tự động ngay lúc này — bạn vẫn có thể tải ảnh QR bên dưới, hoặc gửi lại sau ở trang Tra cứu vé."}
        </div>

        <TicketStub ticket={{ ...result.attendee, qrDataUrl: result.qrDataUrl }} />

        <Link to="/" className="back-link">
          <ArrowLeft size={15} strokeWidth={2.2} /> Về danh sách sự kiện
        </Link>
      </div>
    );
  }

  const notOpen = !OPEN_STATUSES.includes(event.status);

  return (
    <div>
      <Link to="/" className="back-link">
        <ArrowLeft size={15} strokeWidth={2.2} /> Tất cả sự kiện
      </Link>

      <div className="page-intro">
        <h1>{event.name}</h1>
        <div className="event-register-meta">
          <span>
            <Calendar size={14} strokeWidth={2} /> {formatDateTime(event.startAt)}
          </span>
          {event.location?.address && (
            <span>
              <MapPin size={14} strokeWidth={2} /> {event.location.address}
            </span>
          )}
        </div>
        {event.description && <p style={{ marginTop: 12 }}>{event.description}</p>}
      </div>

      {notOpen ? (
        <div className="alert alert-info">
          Sự kiện này hiện không mở đăng ký (chưa công bố, đã kết thúc hoặc đã huỷ).
        </div>
      ) : (
        <form className="register-form" onSubmit={handleSubmit}>
          {submitError && <div className="alert alert-error">{submitError}</div>}

          <div className="field">
            <label htmlFor="fullName">Họ và tên</label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="Nguyễn Văn A"
              className={fieldErrors.fullName ? "has-error" : ""}
              required
            />
            {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="ban@vidu.com"
              className={fieldErrors.email ? "has-error" : ""}
              required
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Mã QR check-in sẽ được gửi tới email này.
            </span>
          </div>

          <div className="field">
            <label htmlFor="phone">Số điện thoại (không bắt buộc)</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="09xx xxx xxx"
              className={fieldErrors.phone ? "has-error" : ""}
            />
            {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
          </div>

          {ticketTypes.length > 0 && (
            <div className="field">
              <label htmlFor="ticketTypeId">Loại vé</label>
              <select
                id="ticketTypeId"
                value={form.ticketTypeId}
                onChange={(e) => updateField("ticketTypeId", e.target.value)}
                required
              >
                <option value="" disabled>
                  Chọn loại vé
                </option>
                {ticketTypes.map((t) => {
                  const soldOut = t.quantityLimit != null && t.quantitySold >= t.quantityLimit;
                  const remaining =
                    t.quantityLimit != null ? Math.max(0, t.quantityLimit - t.quantitySold) : null;
                  return (
                    <option key={t._id} value={t._id} disabled={soldOut}>
                      {t.name}
                      {t.price ? ` — ${t.price.toLocaleString("vi-VN")}đ` : " — Miễn phí"}
                      {soldOut ? " (Hết vé)" : remaining != null ? ` (còn ${remaining})` : ""}
                    </option>
                  );
                })}
              </select>
              {fieldErrors.ticketTypeId && (
                <span className="field-error">{fieldErrors.ticketTypeId}</span>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Đang đăng ký..." : "Đăng ký tham dự"}
          </button>
        </form>
      )}
    </div>
  );
}

export default EventRegister;
