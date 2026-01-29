import { prisma } from '../../shared/database/index.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/utils/errors.js';
import type { UpdateProfileInput, InviteTeamMemberInput, UpdateTeamMemberInput } from './organizer.schema.js';

/**
 * Organizer Profile Response
 */
export interface OrganizerProfile {
  id: string;
  businessName: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  socialLinks: unknown;
  isVerified: boolean;
  verifiedAt: Date | null;
  totalEvents: number;
  totalTicketsSold: number;
  createdAt: Date;
}

/**
 * Team Member Response
 */
export interface TeamMemberResponse {
  id: string;
  role: string;
  permissions: unknown;
  invitedAt: Date;
  acceptedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

class OrganizerService {
  /**
   * Get organizer profile by user ID
   */
  async getProfile(userId: string): Promise<OrganizerProfile> {
    const organizer = await prisma.organizer.findUnique({
      where: { userId },
      select: {
        id: true,
        businessName: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        country: true,
        socialLinks: true,
        isVerified: true,
        verifiedAt: true,
        totalEvents: true,
        totalTicketsSold: true,
        createdAt: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer profile not found');
    }

    return organizer;
  }

  /**
   * Update organizer profile
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<OrganizerProfile> {
    const organizer = await prisma.organizer.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer profile not found');
    }

    const updated = await prisma.organizer.update({
      where: { userId },
      data: {
        businessName: data.businessName,
        description: data.description,
        logoUrl: data.logoUrl,
        coverImageUrl: data.coverImageUrl,
        website: data.website,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        socialLinks: data.socialLinks,
      },
      select: {
        id: true,
        businessName: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        country: true,
        socialLinks: true,
        isVerified: true,
        verifiedAt: true,
        totalEvents: true,
        totalTicketsSold: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Get team members for an organizer
   */
  async getTeamMembers(organizerId: string): Promise<TeamMemberResponse[]> {
    const members = await prisma.teamMember.findMany({
      where: { organizerId },
      orderBy: { invitedAt: 'desc' },
      select: {
        id: true,
        role: true,
        permissions: true,
        invitedAt: true,
        acceptedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return members;
  }

  /**
   * Invite a team member
   */
  async inviteTeamMember(
    organizerId: string,
    invitedByUserId: string,
    data: InviteTeamMemberInput
  ): Promise<TeamMemberResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    if (!user) {
      throw new NotFoundError('User not found with this email. They must register first.');
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        organizerId_userId: {
          organizerId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a team member');
    }

    // Check if user is the organizer owner
    const organizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { userId: true },
    });

    if (organizer?.userId === user.id) {
      throw new ConflictError('Cannot invite the organizer owner as a team member');
    }

    // Create team member invitation
    const member = await prisma.teamMember.create({
      data: {
        organizerId,
        userId: user.id,
        role: data.role,
        permissions: data.permissions,
        invitedBy: invitedByUserId,
      },
      select: {
        id: true,
        role: true,
        permissions: true,
        invitedAt: true,
        acceptedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return member;
  }

  /**
   * Update a team member
   */
  async updateTeamMember(
    organizerId: string,
    memberId: string,
    data: UpdateTeamMemberInput
  ): Promise<TeamMemberResponse> {
    // Verify member exists and belongs to organizer
    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        organizerId,
      },
    });

    if (!member) {
      throw new NotFoundError('Team member not found');
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        role: data.role,
        permissions: data.permissions,
      },
      select: {
        id: true,
        role: true,
        permissions: true,
        invitedAt: true,
        acceptedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Remove a team member
   */
  async removeTeamMember(organizerId: string, memberId: string): Promise<void> {
    // Verify member exists and belongs to organizer
    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        organizerId,
      },
    });

    if (!member) {
      throw new NotFoundError('Team member not found');
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });
  }

  /**
   * Create organizer profile for a user
   * This is called when a user wants to become an organizer
   */
  async createProfile(userId: string, data: Partial<UpdateProfileInput>): Promise<OrganizerProfile> {
    // Check if user already has organizer profile
    const existing = await prisma.organizer.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictError('User already has an organizer profile');
    }

    // Update user role to organizer
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'organizer' },
    });

    // Create organizer profile
    const organizer = await prisma.organizer.create({
      data: {
        userId,
        businessName: data.businessName,
        description: data.description,
        city: data.city,
      },
      select: {
        id: true,
        businessName: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        country: true,
        socialLinks: true,
        isVerified: true,
        verifiedAt: true,
        totalEvents: true,
        totalTicketsSold: true,
        createdAt: true,
      },
    });

    return organizer;
  }
}

export const organizerService = new OrganizerService();
