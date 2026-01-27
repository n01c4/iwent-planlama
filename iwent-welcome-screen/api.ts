
export const API_URL = 'https://api.iwent.com.tr';

// --- Type Definitions based on OpenAPI ---

export interface VenueSummary {
  id: string;
  slug: string;
  name: string;
  profilePhotoUrl?: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  description?: string;
  capacity: number;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  venue?: VenueSummary;
  category?: string;
  bannerUrl?: string;
  photos?: string[];
  priceMin?: number;
  priceMax?: number;
}

export interface User {
  id: string;
  username?: string;
  email: string;
  name?: string;
  city?: string;
  role: 'public' | 'user' | 'organizer' | 'admin';
  avatarUrl?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED';
  price: number;
  qrCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

// --- MOCK DATA FOR FALLBACK ---

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    slug: 'neon-pulse',
    title: 'Neon Pulse Concert',
    description: 'An electrifying night of synth-wave and laser shows.',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days later
    venue: { id: 'v1', slug: 'volkswagen-arena', name: 'Volkswagen Arena' },
    category: 'Konser',
    priceMin: 450,
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    slug: 'jazz-night',
    title: 'Midnight Jazz Session',
    description: 'Smooth jazz vibes all night long.',
    startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    venue: { id: 'v2', slug: 'nardis', name: 'Nardis Jazz Club' },
    category: 'Müzik',
    priceMin: 400,
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    slug: 'digital-art-expo',
    title: 'Future of Art Exhibition',
    description: 'Immersive digital art experience.',
    startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    venue: { id: 'v3', slug: 'arter', name: 'Arter Istanbul' },
    category: 'Sanat',
    priceMin: 150,
    bannerUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    slug: 'summer-fest',
    title: 'Summer Solstice Festival',
    description: 'Welcome summer with the biggest party of the year.',
    startDate: new Date(Date.now() + 86400000 * 20).toISOString(),
    venue: { id: 'v4', slug: 'kucukciftlik', name: 'Küçükçiftlik Park' },
    category: 'Festival',
    priceMin: 850,
    bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800'
  }
];

const MOCK_USER: User = {
  id: 'u1',
  email: 'demo@iwent.com',
  name: 'Can Yılmaz',
  city: 'İstanbul',
  role: 'user',
  avatarUrl: 'https://i.pravatar.cc/150?u=can'
};

const MOCK_TICKET_TYPES: TicketType[] = [
  { id: 't1', eventId: '1', name: 'Genel Giriş', price: 450, capacity: 500, description: 'Ayakta izleme alanı.' },
  { id: 't2', eventId: '1', name: 'Sahne Önü', price: 850, capacity: 100, description: 'Sahnenin hemen önünde özel alan.' },
  { id: 't3', eventId: '1', name: 'VIP Lounge', price: 2500, capacity: 20, description: 'Sınırsız ikram ve özel loca.' }
];

// --- API Client ---

let authToken: string | null = localStorage.getItem('iwent_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('iwent_token', token);
  } else {
    localStorage.removeItem('iwent_token');
  }
};

const headers = () => {
  const h: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    h['Authorization'] = `Bearer ${authToken}`;
  }
  return h;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }
  return res.json();
};

// Helper to simulate API call with fallback
const fetchWithFallback = async <T>(
  url: string, 
  options: RequestInit = {}, 
  fallbackData: T
): Promise<{ data: T }> => {
  try {
    const res = await fetch(url, { ...options, headers: { ...headers(), ...options.headers } });
    if (!res.ok) throw new Error('Network response was not ok');
    return await handleResponse(res);
  } catch (error) {
    console.warn(`API unavailable (${url}), using mock data.`, error);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: fallbackData };
  }
};

export const api = {
  auth: {
    register: async (data: { email: string; password: string; name: string; city?: string }): Promise<AuthResponse> => {
      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(data),
        });
        return await handleResponse(res);
      } catch (e) {
        console.warn('Registration API failed, returning mock token');
        await new Promise(resolve => setTimeout(resolve, 800));
        return { accessToken: 'mock-jwt-token', refreshToken: 'mock-refresh-token' };
      }
    },
    login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
       // Mock login always
       await new Promise(resolve => setTimeout(resolve, 800));
       return { accessToken: 'mock-jwt-token', refreshToken: 'mock-refresh-token' };
    }
  },
  events: {
    list: async (params?: { page?: number; limit?: number; city?: string; category?: string }): Promise<{ data: Event[] }> => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val) searchParams.append(key, String(val));
        });
      }
      return fetchWithFallback<Event[]>(
        `${API_URL}/events?${searchParams.toString()}`,
        {},
        MOCK_EVENTS
      );
    },
    get: async (slug: string): Promise<{ data: Event }> => {
      const event = MOCK_EVENTS.find(e => e.slug === slug) || MOCK_EVENTS[0];
      return fetchWithFallback<Event>(
        `${API_URL}/events/${slug}`,
        {},
        event
      );
    },
    getById: async (id: string): Promise<{ data: Event }> => {
        const event = MOCK_EVENTS.find(e => e.id === id) || MOCK_EVENTS[0];
        return fetchWithFallback<Event>(
          `${API_URL}/events/${id}`,
          {},
          event
        );
    }
  },
  recommendations: {
    discovery: async (): Promise<{ data: Event[] }> => {
      return fetchWithFallback<Event[]>(
        `${API_URL}/recommendations/discovery`,
        {},
        MOCK_EVENTS
      );
    }
  },
  tickets: {
    getTypes: async (eventId: string): Promise<{ data: TicketType[] }> => {
      return fetchWithFallback<TicketType[]>(
        `${API_URL}/ticket-types?eventId=${eventId}`,
        {},
        MOCK_TICKET_TYPES
      );
    },
    purchase: async (data: { eventId: string; tickets?: any[]; ticketTypeId?: string; quantity?: number }) => {
      try {
        const res = await fetch(`${API_URL}/tickets`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(data),
        });
        return await handleResponse(res);
      } catch (e) {
        console.warn('Purchase API failed, simulating success');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { data: { id: 'mock-ticket-id', status: 'CONFIRMED' } };
      }
    }
  },
  user: {
    me: async (): Promise<{ data: User }> => {
      return fetchWithFallback<User>(
        `${API_URL}/me`,
        {},
        MOCK_USER
      );
    },
    update: async (data: Partial<User>) => {
      try {
        const res = await fetch(`${API_URL}/me`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify(data),
        });
        return await handleResponse(res);
      } catch (e) {
        console.warn('Update user API failed, simulating success');
        return { data: { ...MOCK_USER, ...data } };
      }
    },
    myTickets: async (): Promise<{ data: Ticket[] }> => {
      return fetchWithFallback<Ticket[]>(
        `${API_URL}/me/tickets`,
        {},
        []
      );
    }
  }
};
