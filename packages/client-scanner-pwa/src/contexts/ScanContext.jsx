import { createContext, useContext, useState } from 'react';
import { MOCK_SCANNER_EVENTS, MOCK_CHECKIN_HISTORY } from '../constants/mockData';

const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [assignedEvents, setAssignedEvents] = useState(MOCK_SCANNER_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState(MOCK_SCANNER_EVENTS[0]);
  const [checkInHistory, setCheckInHistory] = useState(MOCK_CHECKIN_HISTORY);

  const selectEvent = (eventId) => {
    const event = assignedEvents.find(e => e.id === eventId || e._id === eventId);
    setSelectedEvent(event);
    // Load check-in history từ indexedDB (offline)
  };

  const recordCheckIn = (attendeeId, method = 'qr_scan') => {
    const checkIn = {
      id: Date.now().toString(),
      eventId: selectedEvent?.id,
      attendeeId,
      method,
      timestamp: new Date().toISOString(),
      synced: false
    };
    setCheckInHistory([...checkInHistory, checkIn]);
    return checkIn;
  };

  return (
    <ScanContext.Provider
      value={{
        assignedEvents,
        selectedEvent,
        setSelectedEvent,
        selectEvent,
        checkInHistory,
        recordCheckIn
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within ScanProvider');
  }
  return context;
};
