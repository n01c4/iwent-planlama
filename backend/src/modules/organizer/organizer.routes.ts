import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { organizerService } from './organizer.service.js';
import {
  updateProfileSchema,
  inviteTeamMemberSchema,
  updateTeamMemberSchema,
  teamMemberIdParamsSchema,
  type UpdateProfileInput,
  type InviteTeamMemberInput,
  type UpdateTeamMemberInput,
  type TeamMemberIdParams,
} from './organizer.schema.js';
import { requireAuth, requireOrganizer } from '../../shared/middleware/index.js';
import { ValidationError } from '../../shared/utils/errors.js';

/**
 * Helper to validate with Zod
 */
function validate<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { flatten: () => { fieldErrors: unknown } } } },
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error?.flatten().fieldErrors);
  }
  return result.data as T;
}

/**
 * Organizer Profile & Team Routes
 * Prefix: /api/v1/org
 */
export async function organizerProfileRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/profile
   * Get organizer profile
   */
  app.get(
    '/profile',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const profile = await organizerService.getProfile(userId);

      return reply.send({
        success: true,
        data: profile,
      });
    }
  );

  /**
   * PATCH /org/profile
   * Update organizer profile
   */
  app.patch(
    '/profile',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const data = validate<UpdateProfileInput>(updateProfileSchema, request.body);
      const profile = await organizerService.updateProfile(userId, data);

      return reply.send({
        success: true,
        data: profile,
      });
    }
  );

  /**
   * POST /org/profile
   * Create organizer profile (become an organizer)
   */
  app.post(
    '/profile',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const data = validate<UpdateProfileInput>(updateProfileSchema, request.body || {});
      const profile = await organizerService.createProfile(userId, data);

      return reply.status(201).send({
        success: true,
        data: profile,
      });
    }
  );

  /**
   * GET /org/team
   * Get team members
   */
  app.get(
    '/team',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const members = await organizerService.getTeamMembers(organizerId);

      return reply.send({
        success: true,
        data: members,
      });
    }
  );

  /**
   * POST /org/team
   * Invite team member
   */
  app.post(
    '/team',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const userId = (request as any).user.sub;
      const data = validate<InviteTeamMemberInput>(inviteTeamMemberSchema, request.body);
      const member = await organizerService.inviteTeamMember(organizerId, userId, data);

      return reply.status(201).send({
        success: true,
        data: member,
      });
    }
  );

  /**
   * PATCH /org/team/:id
   * Update team member
   */
  app.patch(
    '/team/:id',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<TeamMemberIdParams>(teamMemberIdParamsSchema, request.params);
      const data = validate<UpdateTeamMemberInput>(updateTeamMemberSchema, request.body);
      const member = await organizerService.updateTeamMember(organizerId, id, data);

      return reply.send({
        success: true,
        data: member,
      });
    }
  );

  /**
   * DELETE /org/team/:id
   * Remove team member
   */
  app.delete(
    '/team/:id',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<TeamMemberIdParams>(teamMemberIdParamsSchema, request.params);
      await organizerService.removeTeamMember(organizerId, id);

      return reply.status(204).send();
    }
  );
}
