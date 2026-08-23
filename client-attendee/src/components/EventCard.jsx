import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import "./EventCard.css";

function formatDate(iso) {
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

function EventCard({ event }) {
  return (
    <Link to={`/events/${event._id}`} className="event-card">
      <div className="event-card-body">
        <h3>{event.name}</h3>
        <div className="event-card-meta">
          <span>
            <Calendar size={14} strokeWidth={2} /> {formatDate(event.startAt)}
          </span>
          {event.location?.address && (
            <span>
              <MapPin size={14} strokeWidth={2} /> {event.location.address}
            </span>
          )}
        </div>
      </div>
      <span className="event-card-cta">
        Đăng ký <ArrowRight size={15} strokeWidth={2.3} />
      </span>
    </Link>
  );
}

export default EventCard;
