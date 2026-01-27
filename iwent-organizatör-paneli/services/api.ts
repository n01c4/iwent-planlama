import { Event, EventStatus } from '../types';

const BASE_URL = 'https://api.iwent.com.tr';

// Helper to get headers
const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// --- Mappers (Backend Schema -> Frontend Type) ---

const mapBackendStatusToFrontend = (status: string): EventStatus => {
  switch (status) {
    case 'PUBLISHED': return EventStatus.PUBLISHED;
    case 'DRAFT': return EventStatus.DRAFT;
    case 'SOLD_OUT': return EventStatus.SOLD_OUT;
    case 'ENDED': return EventStatus.ENDED;
    case 'CANCELLED': return EventStatus.CANCELLED;
    default: return EventStatus.DRAFT;
  }
};

const mapFrontendStatusToBackend = (status: EventStatus): string => {
  switch (status) {
    case EventStatus.PUBLISHED: return 'PUBLISHED';
    case EventStatus.DRAFT: return 'DRAFT';
    case EventStatus.SOLD_OUT: return 'SOLD_OUT';
    case EventStatus.ENDED: return 'ENDED';
    case EventStatus.CANCELLED: return 'CANCELLED';
    default: return 'DRAFT';
  }
};

// Transform API response to UI Event Interface
const transformEvent = (apiEvent: any): Event => {
  // Calculate revenue and sold count roughly from available data or default to 0
  // Note: The API spec for 'Event' doesn't explicitly have 'revenue' or 'sold' at the top level,
  // usually these come from specific analytics endpoints, but we map what we can.
  
  const ticketTypes = (apiEvent.tickettypes || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    quota: t.capacity,
    sold: 0, // Not provided in basic event list, usually requires separate fetch
  }));

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    date: apiEvent.startDate,
    location: apiEvent.venue ? `${apiEvent.venue.name}, ${apiEvent.venue.city || ''}` : 'Online / Belirtilmedi',
    status: mapBackendStatusToFrontend(apiEvent.status || 'DRAFT'), // Assuming API returns a status field even if omitted in summary
    ticketTypes: ticketTypes,
    revenue: 0, // Placeholder as list endpoint doesn't return revenue
    image: apiEvent.bannerUrl || `https://picsum.photos/1200/600?random=${apiEvent.id}`, // Increased resolution for better quality
  };
};

// --- API Methods ---

export const api = {
  // Events
  getEvents: async (): Promise<Event[]> => {
    try {
      // In a real scenario, we might filter by organizerId=me if the backend doesn't do it automatically based on token
      const response = await fetch(`${BASE_URL}/events?limit=50`, {
        headers: getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const json = await response.json();
      return json.data.map(transformEvent);
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  createEvent: async (eventData: Partial<Event>): Promise<Event | null> => {
    try {
      // Transform UI data to Backend Payload
      const payload = {
        title: eventData.title,
        description: 'Frontend generated description', // The UI currently stores description in a separate form state not fully passed in this partial, simplifying for demo
        startAt: eventData.date, // Assuming date string is ISO from CreateEvent
        endAt: eventData.date, // Simplification
        venueId: 'mock-venue-id', // The UI collects text location, but backend needs ID. Hardcoded for demo.
        category: 'music', // Default or from form
        bannerUrl: eventData.image,
        // Map ticket types if API supports creating them nested, otherwise separate calls needed
      };

      const response = await fetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create event');

      const json = await response.json();
      return transformEvent(json.data);
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  getEventDetails: async (id: string) => {
    const response = await fetch(`${BASE_URL}/events/${id}`, { headers: getHeaders() });
    return response.json();
  },

  // Chat / Moderation
  getMyEventChats: async () => {
    try {
      const response = await fetch(`${BASE_URL}/chat/my-event-chats`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch chats');
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },
  
  // Stats (Mocking logic for dashboard aggregator since no direct endpoint exists)
  getDashboardStats: async () => {
     // This would ideally be a call to /organizers/{id}/stats
     return null; 
  }
};