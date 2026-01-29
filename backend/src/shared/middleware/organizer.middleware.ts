import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../database/index.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

/**
 * Organizer Middleware
 * Provides authorization checks for organizer-specific routes
 */

/**
 * Require user to have an organizer profile
 * Attaches organizer info to request
 */
export async function requireOrganizer(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const userId = (request as any).user?.sub;

  if (!userId) {
    throw new ForbiddenError('Authentication required');
  }

  const organizer = await prisma.organizer.findUnique({
    where: { userId },
    select: {
      id: true,
      businessName: true,
      isVerified: true,
    },
  });

  if (!organizer) {
    throw new ForbiddenError('Organizer profile required. Please create an organizer profile first.');
  }

  // Attach organizer info to request
  (request as any).organizer = organizer;
}

/**
 * Require ownership of an event
 * Must be called after requireOrganizer
 */
export async function requireEventOwnership(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const organizerId = (request as any).organizer?.id;
  const eventId = (request.params as any).id || (request.params as any).eventId;

  if (!organizerId) {
    throw new ForbiddenError('Organizer context required');
  }

  if (!eventId) {
    throw new ForbiddenError('Event ID required');
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, deletedAt: true },
  });

  if (!event || event.deletedAt) {
    throw new NotFoundError('Event not found');
  }

  if (event.organizerId !== organizerId) {
    throw new ForbiddenError('You do not have permission to access this event');
  }
}

/**
 * Require ownership of a venue
 * Must be called after requireOrganizer
 */
export async function requireVenueOwnership(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const organizerId = (request as any).organizer?.id;
  const venueId = (request.params as any).id || (request.params as any).venueId;

  if (!organizerId) {
    throw new ForbiddenError('Organizer context required');
  }

  if (!venueId) {
    throw new ForbiddenError('Venue ID required');
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { managedByOrganizerId: true },
  });

  if (!venue) {
    throw new NotFoundError('Venue not found');
  }

  if (venue.managedByOrganizerId !== organizerId) {
    throw new ForbiddenError('You do not have permission to access this venue');
  }
}

/**
 * Require ownership of an artist
 * Must be called after requireOrganizer
 */
export async function requireArtistOwnership(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const organizerId = (request as any).organizer?.id;
  const artistId = (request.params as any).id || (request.params as any).artistId;

  if (!organizerId) {
    throw new ForbiddenError('Organizer context required');
  }

  if (!artistId) {
    throw new ForbiddenError('Artist ID required');
  }

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { managedByOrganizerId: true },
  });

  if (!artist) {
    throw new NotFoundError('Artist not found');
  }

  if (artist.managedByOrganizerId !== organizerId) {
    throw new ForbiddenError('You do not have permission to access this artist');
  }
}

/**
 * Require ownership of a ticket type (through event)
 * Must be called after requireOrganizer
 */
export async function requireTicketTypeOwnership(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const organizerId = (request as any).organizer?.id;
  const ticketTypeId = (request.params as any).id || (request.params as any).ticketTypeId;

  if (!organizerId) {
    throw new ForbiddenError('Organizer context required');
  }

  if (!ticketTypeId) {
    throw new ForbiddenError('Ticket type ID required');
  }

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
    select: {
      event: {
        select: { organizerId: true },
      },
    },
  });

  if (!ticketType) {
    throw new NotFoundError('Ticket type not found');
  }

  if (ticketType.event.organizerId !== organizerId) {
    throw new ForbiddenError('You do not have permission to access this ticket type');
  }
}

/**
 * Require team member permission
 * Checks if user has specific permission in the organizer's team
 */
export function requireTeamPermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as any).user?.sub;
    const organizerId = (request as any).organizer?.id;

    if (!userId || !organizerId) {
      throw new ForbiddenError('Authentication required');
    }

    // Check if user is the owner (has all permissions)
    const organizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { userId: true },
    });

    if (organizer?.userId === userId) {
      return; // Owner has all permissions
    }

    // Check team member permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        organizerId_userId: {
          organizerId,
          userId,
        },
      },
      select: { permissions: true, acceptedAt: true },
    });

    if (!teamMember) {
      throw new ForbiddenError('You are not a member of this organization');
    }

    if (!teamMember.acceptedAt) {
      throw new ForbiddenError('Your team invitation is pending acceptance');
    }

    const permissions = teamMember.permissions as string[];
    if (!permissions.includes(permission) && !permissions.includes('*')) {
      throw new ForbiddenError(`Permission '${permission}' required`);
    }
  };
}
