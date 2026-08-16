import { createContext, useContext, useState } from 'react';
import { MOCK_EVENTS } from '../constants/mockData';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getEvents = () => {
    // Mock - sẽ thay bằng API call
    return events;
  };

  const getEventById = (id) => {
    return events.find(e => e.id === id);
  };

  const createEvent = (eventData) => {
    const newEvent = {
      id: Date.now().toString(),
      ...eventData,
      stats: { totalRegistered: 0, totalCheckedIn: 0 }
    };
    setEvents([...events, newEvent]);
    return newEvent;
  };

  const updateEvent = (id, eventData) => {
    setEvents(events.map(e => e.id === id ? { ...e, ...eventData } : e));
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  return (
    <EventContext.Provider
      value={{
        events,
        selectedEvent,
        setSelectedEvent,
        isLoading,
        getEvents,
        getEventById,
        createEvent,
        updateEvent,
        deleteEvent
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within EventProvider');
  }
  return context;
};
