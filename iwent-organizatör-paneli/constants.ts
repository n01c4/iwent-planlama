import { Event, EventStatus, DashboardStats, SalesDataPoint } from './types';

export const MOCK_STATS: DashboardStats = {
  totalRevenue: 845200,
  ticketsSold: 3450,
  activeEvents: 12,
  avgTicketPrice: 245
};

export const MOCK_SALES_DATA: SalesDataPoint[] = [
  { date: '01 Ağu', amount: 12500, tickets: 45 },
  { date: '05 Ağu', amount: 18900, tickets: 68 },
  { date: '10 Ağu', amount: 15600, tickets: 52 },
  { date: '15 Ağu', amount: 28400, tickets: 95 },
  { date: '20 Ağu', amount: 32100, tickets: 110 },
  { date: '25 Ağu', amount: 24500, tickets: 82 },
  { date: '30 Ağu', amount: 45200, tickets: 150 },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Neon Festivali 2024',
    date: '2024-09-15T18:00:00',
    location: 'KüçükÇiftlik Park, İstanbul',
    status: EventStatus.PUBLISHED,
    revenue: 450000,
    ticketTypes: [
      { id: 't1', name: 'Genel Giriş', price: 500, quota: 1000, sold: 450 },
      { id: 't2', name: 'VIP', price: 1500, quota: 200, sold: 150 }
    ],
    image: 'https://picsum.photos/400/200?random=1'
  },
  {
    id: '2',
    title: 'Teknoloji Zirvesi',
    date: '2024-10-05T09:00:00',
    location: 'Lütfi Kırdar, İstanbul',
    status: EventStatus.SOLD_OUT,
    revenue: 280000,
    ticketTypes: [
      { id: 't3', name: 'Erken Dönem', price: 300, quota: 500, sold: 500 },
      { id: 't4', name: 'Standart', price: 600, quota: 500, sold: 450 }
    ],
    image: 'https://picsum.photos/400/200?random=2'
  },
  {
    id: '3',
    title: 'Yaz Veda Konseri',
    date: '2024-09-22T20:30:00',
    location: 'Harbiye Açıkhava',
    status: EventStatus.DRAFT,
    revenue: 0,
    ticketTypes: [],
    image: 'https://picsum.photos/400/200?random=3'
  },
  {
    id: '4',
    title: 'Gastronomi Atölyesi',
    date: '2024-11-12T14:00:00',
    location: 'MSA, İstanbul',
    status: EventStatus.PUBLISHED,
    revenue: 45000,
    ticketTypes: [
      { id: 't5', name: 'Katılım', price: 1500, quota: 30, sold: 12 }
    ],
    image: 'https://picsum.photos/400/200?random=4'
  },
  {
    id: '5',
    title: 'Start-up Networking Gecesi',
    date: '2024-08-30T19:00:00',
    location: 'Kolektif House',
    status: EventStatus.ENDED,
    revenue: 12000,
    ticketTypes: [],
    image: 'https://picsum.photos/400/200?random=5'
  }
];
