import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event } from '../types';
import { api } from '../services/api';
import { MOCK_EVENTS } from '../constants'; // Fallback if API fails or for dev

interface EventContextType {
  events: Event[];
  isLoading: boolean;
  addEvent: (event: Event) => Promise<void>;
  refreshEvents: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    const data = await api.getEvents();
    if (data && data.length > 0) {
      setEvents(data);
    } else {
      // Fallback to mocks if API is empty or fails (for demonstration purposes)
      console.warn('API returned empty or failed, using mocks for demo.');
      setEvents(MOCK_EVENTS);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (event: Event) => {
    // Optimistic update
    setEvents(prev => [event, ...prev]);
    
    // Real API call
    const created = await api.createEvent(event);
    if (created) {
      // Replace optimistic item with real server response
      setEvents(prev => [created, ...prev.filter(e => e.id !== event.id)]);
    }
  };

  return (
    <EventContext.Provider value={{ events, isLoading, addEvent, refreshEvents: fetchEvents }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};