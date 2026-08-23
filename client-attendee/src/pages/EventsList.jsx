import { useEffect, useState } from "react";
import { CalendarSearch } from "lucide-react";
import EventCard from "../components/EventCard.jsx";
import { eventsApi, describeApiError } from "../api.js";
import "./EventsList.css";

// Chỉ hiển thị sự kiện đang mở đăng ký công khai (mục 2.1.3 spec) —
// 'draft' (BTC chưa công bố), 'completed', 'cancelled' bị ẩn khỏi trang
// public dù GET /api/events (không auth) trả về tất cả.
const OPEN_STATUSES = ["published", "ongoing"];

function EventsList() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    eventsApi
      .list()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setEvents(list.filter((e) => OPEN_STATUSES.includes(e.status)));
      })
      .catch((err) => !cancelled && setError(describeApiError(err).message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="page-intro">
        <h1>Sự kiện đang mở đăng ký</h1>
        <p>Chọn 1 sự kiện để đăng ký tham dự và nhận mã QR check-in qua email.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {events === null && !error && <p>Đang tải danh sách sự kiện...</p>}

      {events?.length === 0 && (
        <div className="empty-state">
          <CalendarSearch size={28} strokeWidth={1.8} />
          <p>Hiện chưa có sự kiện nào mở đăng ký. Vui lòng quay lại sau.</p>
        </div>
      )}

      {events?.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}

export default EventsList;
