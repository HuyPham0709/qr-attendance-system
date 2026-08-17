import PageHeader from "../components/PageHeader.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useState } from "react";
import "./Events.css";

const EVENTS = [
  { id: 1, name: "Tech Conference 2026", date: "24/08/2026", place: "SECC, Quận 7", attendees: 380, checkedIn: 245, status: "Đang diễn ra" },
  { id: 2, name: "Workshop React nâng cao", date: "30/08/2026", place: "The Sentry, Quận 1", attendees: 80, checkedIn: 0, status: "Sắp diễn ra" },
  { id: 3, name: "Demo Day Startup", date: "12/08/2026", place: "Đại học Bách Khoa", attendees: 150, checkedIn: 150, status: "Đã kết thúc" },
];

function Events() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const visibleEvents = EVENTS.filter((event) =>
    (filter === "Tất cả" || event.status === filter) &&
    event.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Sự kiện"
        subtitle="Danh sách sự kiện và form tạo/sửa sự kiện."
        action={
          <button type="button" className="btn-primary" disabled>
            + Tạo sự kiện
          </button>
        }
      />
      <section className="events-panel" aria-label="Danh sách sự kiện mock">
        <div className="events-toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sự kiện..." aria-label="Tìm sự kiện" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Lọc theo trạng thái">
            <option>Tất cả</option><option>Đang diễn ra</option><option>Sắp diễn ra</option><option>Đã kết thúc</option>
          </select>
        </div>
        <div className="events-list">
          {visibleEvents.map((event) => (
            <article className="event-row" key={event.id}>
              <span className="event-icon"><CalendarDays size={20} /></span>
              <div className="event-summary"><h2>{event.name}</h2><p><CalendarDays size={14} /> {event.date} <span>·</span> <MapPin size={14} /> {event.place}</p></div>
              <div className="event-attendance"><Users size={16} /><strong>{event.checkedIn}/{event.attendees}</strong><span>đã check-in</span></div>
              <span className={`event-status ${event.status === "Đang diễn ra" ? "is-live" : ""}`}>{event.status}</span>
            </article>
          ))}
        </div>
      </section>
      <PlaceholderPanel eyebrow="Tuần 2 · Auth &amp; Event CRUD">
        Bảng danh sách sự kiện sẽ kết nối với API CRUD Event thật (Thành viên
        A) ở Tuần 2.
      </PlaceholderPanel>
    </>
  );
}

export default Events;
