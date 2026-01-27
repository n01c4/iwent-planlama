
export enum EventStatus {
  DRAFT = 'Taslak',
  PUBLISHED = 'Yayında',
  SOLD_OUT = 'Tükendi',
  ENDED = 'Tamamlandı',
  CANCELLED = 'İptal'
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: EventStatus;
  ticketTypes: TicketType[];
  revenue: number;
  image?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  ticketsSold: number;
  activeEvents: number;
  avgTicketPrice: number;
}

export interface SalesDataPoint {
  date: string;
  amount: number;
  tickets: number;
}

// --- Chat & Engagement Types ---

export type MessageType = 'text' | 'image' | 'poll' | 'announcement' | 'quiz' | 'voucher';

export interface ChatMessage {
  id: string;
  type: MessageType;
  sender: {
    id: string;
    name: string;
    role: 'user' | 'organizer' | 'admin' | 'bot';
    avatar?: string;
    hasTicket?: boolean; // Verified ticket holder badge
  };
  content: string; // Text content or JSON string for complex types
  data?: any; // Structured data for polls, quizzes etc.
  timestamp: string;
  reactions?: Record<string, number>;
}

export interface PollData {
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  isActive: boolean;
  expiresAt?: string; // ISO string for countdown
}

export interface AnnouncementData {
  type: 'info' | 'critical' | 'party'; // info: blue, critical: red, party: gradient
  title: string;
  message: string;
}

export interface QuizData {
  question: string;
  options: string[];
  correctOptionIndex: number;
  prize?: string;
  status: 'active' | 'finished';
  participants: number;
  expiresAt: string;
}

export interface VoucherData {
  title: string;
  code: string;
  discount: string;
  totalLimit: number;
  claimed: number;
}
