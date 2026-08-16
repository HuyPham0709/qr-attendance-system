import { useState } from 'react';
import PageHeader from "../components/PageHeader.jsx";
import EventCard from "../components/EventCard.jsx";
import { useEvent } from '../contexts/EventContext.jsx';
import './Events.css';

function Events() {
  const { events } = useEvent();
  const [filter, setFilter] = useState('all');

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.status === filter);

  return (
    <>
      <PageHeader
        title="Sự kiện"
        subtitle={`Quản lý ${filteredEvents.length} sự kiện`}
        action={
          <button type="button" className="btn-primary">
            + Tạo sự kiện
          </button>
        }
      />

      <div className="events-container">
        <div className="events-filter">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({events.length})
          </button>
          <button
            className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Nháp
          </button>
          <button
            className={`filter-btn ${filter === 'published' ? 'active' : ''}`}
            onClick={() => setFilter('published')}
          >
            Công khai
          </button>
          <button
            className={`filter-btn ${filter === 'ongoing' ? 'active' : ''}`}
            onClick={() => setFilter('ongoing')}
          >
            Đang diễn ra
          </button>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <p>Không có sự kiện nào</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Events;
