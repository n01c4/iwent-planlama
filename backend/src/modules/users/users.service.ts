import { prisma } from '../../shared/database/index.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import type { UpdateProfileInput } from './users.schema.js';
import { ordersService } from '../orders/orders.service.js';
import { ticketsService } from '../tickets/tickets.service.js';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  city: string | null;
  role: 'public' | 'user' | 'organizer' | 'admin';
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  emailVerified: boolean;
  createdAt: Date;
}

export interface PublicUserProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  city?: string | null;
  bio?: string | null;
}

export class UsersService {
  /**
   * Get current user's profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        role: true,
        avatarUrl: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.bio !== undefined) updateData.bio = input.bio;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
    if (input.dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(input.dateOfBirth);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        role: true,
        avatarUrl: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Get public profile of another user
   * Returns limited info based on relationship (friend or shared event)
   */
  async getPublicProfile(targetUserId: string, viewerId?: string): Promise<PublicUserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId, deletedAt: null },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        city: true,
        bio: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // If no viewer (public access), return minimal info
    if (!viewerId) {
      return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      };
    }

    // If viewing own profile, return full info
    if (viewerId === targetUserId) {
      return user;
    }

    // TODO: Check if they are friends or attended same event
    // For now, return full public profile
    // In production, implement the visibility rules from PRD:
    // - Friends can see full profile
    // - Users who attended same event can see full profile
    // - Otherwise, only name and avatarUrl

    return user;
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(userId: string) {
    const result = await ticketsService.getUserTickets(userId, { page: 1, limit: 20 });
    return result.items;
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string) {
    const result = await ordersService.getUserOrders(userId, { page: 1, limit: 20 });
    return result.items;
  }

  /**
   * Get user's notifications (placeholder)
   */
  async getUserNotifications(userId: string, status?: 'unread' | 'all') {
    // Will be implemented in notifications module
    return [];
  }

  /**
   * Mark notifications as read (placeholder)
   */
  async markNotificationsRead(userId: string, ids?: string[], all?: boolean) {
    // Will be implemented in notifications module
    return { updated: 0 };
  }

  /**
   * Get user's event calendar (placeholder)
   */
  async getUserCalendar(userId: string) {
    // Will be implemented in events module
    return [];
  }
}

export const usersService = new UsersService();
