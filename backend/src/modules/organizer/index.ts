import type { FastifyInstance } from 'fastify';
import { organizerProfileRoutes } from './organizer.routes.js';
import { orgEventsRoutes } from './events/index.js';
import { orgTicketsRoutes } from './tickets/index.js';
import { orgVenuesRoutes } from './venues/index.js';
import { orgArtistsRoutes } from './artists/index.js';
import { orgOrdersRoutes } from './orders/index.js';
import { pricingRoutes } from './pricing/index.js';
import { analyticsRoutes } from './analytics/index.js';
import { checkinRoutes } from './checkin/index.js';

/**
 * Organizer Module - Main Entry Point
 * Combines all organizer routes
 * Prefix: /api/v1/org
 */
export async function organizerRoutes(app: FastifyInstance): Promise<void> {
  // Profile & Team routes (/org/profile, /org/team)
  await app.register(organizerProfileRoutes);

  // Events CRUD routes (/org/events)
  await app.register(orgEventsRoutes, { prefix: '/events' });

  // Ticket Types routes (/org/events/:id/ticket-types, /org/ticket-types)
  await app.register(orgTicketsRoutes);

  // Venues CRUD routes (/org/venues)
  await app.register(orgVenuesRoutes, { prefix: '/venues' });

  // Artists CRUD routes (/org/artists)
  await app.register(orgArtistsRoutes, { prefix: '/artists' });

  // Faz 4: Orders routes (/org/events/:id/orders, /org/orders/:orderId)
  await app.register(orgOrdersRoutes);

  // Faz 4: Pricing routes (/org/events/:id/discount-codes, /org/events/:id/pricing-rules)
  await app.register(pricingRoutes);

  // Faz 6: Analytics routes (/org/analytics/*)
  await app.register(analyticsRoutes);

  // Faz 6: Check-in routes (/org/events/:id/attendees, /org/events/:id/checkin)
  await app.register(checkinRoutes);
}

// Re-export services for external use
export { organizerService } from './organizer.service.js';
export { orgEventsService } from './events/index.js';
export { orgTicketsService } from './tickets/index.js';
export { orgVenuesService } from './venues/index.js';
export { orgArtistsService } from './artists/index.js';
export { orgOrdersService } from './orders/index.js';
export { pricingService } from './pricing/index.js';
export { analyticsService } from './analytics/index.js';
export { checkinService } from './checkin/index.js';
