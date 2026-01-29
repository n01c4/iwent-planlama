import { prisma } from '../../shared/database/prisma.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../shared/utils/errors.js';
import type {
  PaginationQuery,
  FriendRequestsQuery,
  FriendsSearchQuery,
} from './social.schema.js';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

interface UserSummary {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface FriendResponse {
  id: string;
  user: UserSummary;
  status: string;
  createdAt: Date;
}

interface FriendRequestResponse {
  id: string;
  user: UserSummary;
  status: string;
  direction: 'sent' | 'received';
  createdAt: Date;
}

interface BlockedUserResponse {
  id: string;
  user: UserSummary;
  blockedAt: Date;
}

interface LikedEventResponse {
  id: string;
  slug: string;
  title: string;
  bannerUrl: string | null;
  startDate: Date;
  city: string | null;
  venueName: string | null;
  likedAt: Date;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// =============================================================================
// SOCIAL SERVICE
// =============================================================================

class SocialService {
  // ===========================================================================
  // FRIENDSHIP MANAGEMENT
  // ===========================================================================

  /**
   * Get user's friends list
   */
  async getFriends(
    userId: string,
    query: FriendsSearchQuery
  ): Promise<PaginatedResponse<FriendResponse>> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { requester: { name: { contains: search, mode: 'insensitive' as const } } },
            { addressee: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    // Get accepted friendships where user is either requester or addressee
    const [friendships, total] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId: userId }, { addresseeId: userId }],
          ...searchFilter,
        },
        include: {
          requester: { select: { id: true, name: true, avatarUrl: true } },
          addressee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { respondedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.friendship.count({
        where: {
          status: 'accepted',
          OR: [{ requesterId: userId }, { addresseeId: userId }],
          ...searchFilter,
        },
      }),
    ]);

    const items: FriendResponse[] = friendships.map((f) => {
      // Get the other user (friend)
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        id: f.id,
        user: friend,
        status: f.status,
        createdAt: f.createdAt,
      };
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
    };
  }

  /**
   * Get pending friend requests (sent and/or received)
   */
  async getFriendRequests(
    userId: string,
    query: FriendRequestsQuery
  ): Promise<PaginatedResponse<FriendRequestResponse>> {
    const { page, limit, type } = query;
    const skip = (page - 1) * limit;

    // Build direction filter
    let directionFilter: object;
    if (type === 'sent') {
      directionFilter = { requesterId: userId };
    } else if (type === 'received') {
      directionFilter = { addresseeId: userId };
    } else {
      directionFilter = { OR: [{ requesterId: userId }, { addresseeId: userId }] };
    }

    const [requests, total] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          status: 'pending',
          ...directionFilter,
        },
        include: {
          requester: { select: { id: true, name: true, avatarUrl: true } },
          addressee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.friendship.count({
        where: {
          status: 'pending',
          ...directionFilter,
        },
      }),
    ]);

    const items: FriendRequestResponse[] = requests.map((r) => {
      const isSent = r.requesterId === userId;
      const otherUser = isSent ? r.addressee : r.requester;
      return {
        id: r.id,
        user: otherUser,
        status: r.status,
        direction: isSent ? 'sent' : 'received',
        createdAt: r.createdAt,
      };
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
    };
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string, targetUserId: string): Promise<FriendRequestResponse> {
    // Validation: Cannot send to self
    if (userId === targetUserId) {
      throw new BadRequestError('Cannot send friend request to yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check existing friendship (both directions)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        throw new ConflictError('Already friends with this user');
      }
      if (existing.status === 'pending') {
        // If target already sent us a request, auto-accept
        if (existing.requesterId === targetUserId) {
          const updated = await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: 'accepted', respondedAt: new Date() },
            include: {
              requester: { select: { id: true, name: true, avatarUrl: true } },
            },
          });
          return {
            id: updated.id,
            user: updated.requester,
            status: updated.status,
            direction: 'received',
            createdAt: updated.createdAt,
          };
        }
        throw new ConflictError('Friend request already pending');
      }
      if (existing.status === 'blocked') {
        // Check who blocked whom
        if (existing.requesterId === targetUserId) {
          // We are blocked by target
          throw new ForbiddenError('Cannot send request to this user');
        }
        // We blocked them - update to pending
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 'pending', respondedAt: null },
          include: {
            addressee: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
        return {
          id: updated.id,
          user: updated.addressee,
          status: updated.status,
          direction: 'sent',
          createdAt: updated.createdAt,
        };
      }
      if (existing.status === 'rejected') {
        // Allow re-request after rejection (update existing)
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: {
            requesterId: userId,
            addresseeId: targetUserId,
            status: 'pending',
            respondedAt: null,
          },
        });
        return {
          id: updated.id,
          user: targetUser,
          status: updated.status,
          direction: 'sent',
          createdAt: updated.createdAt,
        };
      }
    }

    // Create new friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: targetUserId,
        status: 'pending',
      },
    });

    return {
      id: friendship.id,
      user: targetUser,
      status: friendship.status,
      direction: 'sent',
      createdAt: friendship.createdAt,
    };
  }

  /**
   * Accept or reject friend request
   */
  async respondToFriendRequest(
    userId: string,
    requestId: string,
    action: 'accept' | 'reject'
  ): Promise<void> {
    const request = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        addresseeId: userId, // Only addressee can respond
        status: 'pending',
      },
    });

    if (!request) {
      throw new NotFoundError('Friend request not found');
    }

    await prisma.friendship.update({
      where: { id: requestId },
      data: {
        status: action === 'accept' ? 'accepted' : 'rejected',
        respondedAt: new Date(),
      },
    });
  }

  /**
   * Remove friend
   */
  async removeFriend(userId: string, friendshipId: string): Promise<void> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    if (!friendship) {
      throw new NotFoundError('Friendship not found');
    }

    await prisma.friendship.delete({
      where: { id: friendshipId },
    });
  }

  /**
   * Block user
   */
  async blockUser(userId: string, targetUserId: string): Promise<void> {
    if (userId === targetUserId) {
      throw new BadRequestError('Cannot block yourself');
    }

    // Check if target exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check existing relationship
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      // Update to blocked
      await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId: userId, // Blocker becomes requester
          addresseeId: targetUserId,
          status: 'blocked',
          respondedAt: new Date(),
        },
      });
    } else {
      // Create blocked relationship
      await prisma.friendship.create({
        data: {
          requesterId: userId,
          addresseeId: targetUserId,
          status: 'blocked',
          respondedAt: new Date(),
        },
      });
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string): Promise<BlockedUserResponse[]> {
    const blocked = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: 'blocked',
      },
      include: {
        addressee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { respondedAt: 'desc' },
    });

    return blocked.map((b) => ({
      id: b.id,
      user: b.addressee,
      blockedAt: b.respondedAt || b.createdAt,
    }));
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, targetUserId: string): Promise<void> {
    const blocked = await prisma.friendship.findFirst({
      where: {
        requesterId: userId,
        addresseeId: targetUserId,
        status: 'blocked',
      },
    });

    if (!blocked) {
      throw new NotFoundError('Blocked user not found');
    }

    await prisma.friendship.delete({
      where: { id: blocked.id },
    });
  }

  // ===========================================================================
  // LIKES MANAGEMENT
  // ===========================================================================

  /**
   * Get user's liked events
   */
  async getLikedEvents(
    userId: string,
    query: PaginationQuery
  ): Promise<PaginatedResponse<LikedEventResponse>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.userLike.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              slug: true,
              title: true,
              bannerUrl: true,
              startDate: true,
              city: true,
              venue: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userLike.count({ where: { userId } }),
    ]);

    const items: LikedEventResponse[] = likes.map((l) => ({
      id: l.event.id,
      slug: l.event.slug,
      title: l.event.title,
      bannerUrl: l.event.bannerUrl,
      startDate: l.event.startDate,
      city: l.event.city,
      venueName: l.event.venue?.name || null,
      likedAt: l.createdAt,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
    };
  }

  /**
   * Like an event
   */
  async likeEvent(userId: string, eventId: string): Promise<void> {
    // Check event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if already liked
    const existing = await prisma.userLike.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      throw new ConflictError('Event already liked');
    }

    // Create like and increment count
    await prisma.$transaction([
      prisma.userLike.create({
        data: { userId, eventId },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
  }

  /**
   * Unlike an event
   */
  async unlikeEvent(userId: string, eventId: string): Promise<void> {
    const existing = await prisma.userLike.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!existing) {
      throw new NotFoundError('Like not found');
    }

    // Delete like and decrement count
    await prisma.$transaction([
      prisma.userLike.delete({
        where: { id: existing.id },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
  }

  // ===========================================================================
  // PROFILE VISIBILITY HELPERS
  // ===========================================================================

  /**
   * Check if viewer can see full profile of target user
   */
  async canViewFullProfile(viewerId: string, targetUserId: string): Promise<boolean> {
    // Own profile - always full access
    if (viewerId === targetUserId) {
      return true;
    }

    // Check if friends
    if (await this.areFriends(viewerId, targetUserId)) {
      return true;
    }

    // Check if have common event attendance
    if (await this.haveCommonEventAttendance(viewerId, targetUserId)) {
      return true;
    }

    return false;
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, addresseeId: userId2 },
          { requesterId: userId2, addresseeId: userId1 },
        ],
        status: 'accepted',
      },
    });

    return !!friendship;
  }

  /**
   * Check if user is blocked by another user
   */
  async isBlockedBy(userId: string, targetUserId: string): Promise<boolean> {
    const blocked = await prisma.friendship.findFirst({
      where: {
        requesterId: targetUserId,
        addresseeId: userId,
        status: 'blocked',
      },
    });

    return !!blocked;
  }

  /**
   * Check if users have mutual block
   */
  async hasBlockRelation(userId1: string, userId2: string): Promise<boolean> {
    const blocked = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, addresseeId: userId2, status: 'blocked' },
          { requesterId: userId2, addresseeId: userId1, status: 'blocked' },
        ],
      },
    });

    return !!blocked;
  }

  /**
   * Check if two users have common event attendance
   */
  async haveCommonEventAttendance(userId1: string, userId2: string): Promise<boolean> {
    // Check for CONFIRMED tickets at same event
    const commonEvent = await prisma.ticket.findFirst({
      where: {
        userId: userId1,
        status: 'CONFIRMED',
        event: {
          tickets: {
            some: {
              userId: userId2,
              status: 'CONFIRMED',
            },
          },
        },
      },
    });

    return !!commonEvent;
  }

  /**
   * Check if event is liked by user
   */
  async isEventLiked(userId: string, eventId: string): Promise<boolean> {
    const like = await prisma.userLike.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    return !!like;
  }
}

export const socialService = new SocialService();
