// Global type declarations

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export type UserRole = 'public' | 'user' | 'organizer' | 'admin';

export type OrderStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export type TicketStatus = 'RESERVED' | 'CONFIRMED' | 'CANCELLED';

export type EventStatus = 'draft' | 'published' | 'unpublished' | 'cancelled';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
