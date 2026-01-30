import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './shared/config/index.js';
import { errorHandler, registerRateLimit } from './shared/middleware/index.js';

// Module imports - Faz 1
import { authRoutes } from './modules/auth/index.js';
import { usersRoutes } from './modules/users/index.js';

// Module imports - Faz 2
import { eventsRoutes } from './modules/events/index.js';
import { venuesRoutes } from './modules/venues/index.js';
import { artistsRoutes } from './modules/artists/index.js';
import { searchRoutes } from './modules/search/index.js';
import { discoveryRoutes } from './modules/discovery/index.js';

// Module imports - Faz 3
import { organizerRoutes } from './modules/organizer/index.js';

// Module imports - Faz 4
import { ordersRoutes } from './modules/orders/index.js';
import { ticketsRoutes } from './modules/tickets/index.js';
import { paymentsRoutes } from './modules/payments/index.js';
import { startOrderExpirationJob } from './shared/jobs/index.js';

// Module imports - Faz 5 (Social Features)
import { socialRoutes } from './modules/social/index.js';
import { chatRoutes } from './modules/chat/index.js';

// Module imports - Faz 7 (Notifications & Moderation)
import { notificationsRoutes, broadcastRoutes } from './modules/notifications/index.js';
import { moderationRoutes, userReportRoutes } from './modules/moderation/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Security plugins
  await app.register(cors, {
    origin: env.NODE_ENV === 'production'
      ? ['https://iwent.com.tr', 'https://app.iwent.com.tr']
      : true,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  // Rate limiting
  await registerRateLimit(app);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health & system routes
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  app.get('/ready', async () => ({
    status: 'ok',
  }));

  app.get('/config', async () => ({
    version: '1.0.0',
    environment: env.NODE_ENV,
  }));

  // API routes with /api/v1 prefix
  await app.register(async (api) => {
    // Faz 1: Auth & Users
    await api.register(authRoutes, { prefix: '/auth' });
    await api.register(usersRoutes, { prefix: '/users' });

    // Faz 2: Core Events
    await api.register(eventsRoutes, { prefix: '/events' });
    await api.register(venuesRoutes, { prefix: '/venues' });
    await api.register(artistsRoutes, { prefix: '/artists' });
    await api.register(searchRoutes, { prefix: '/search' });
    await api.register(discoveryRoutes, { prefix: '/recommendations' });

    // Faz 3: Organizer Tools
    await api.register(organizerRoutes, { prefix: '/org' });

    // Faz 4: Ticketing & Payments
    await api.register(ordersRoutes, { prefix: '/orders' });
    await api.register(ticketsRoutes, { prefix: '/tickets' });
    await api.register(paymentsRoutes, { prefix: '/payments' });

    // Faz 5: Social Features
    await api.register(socialRoutes, { prefix: '/users' }); // Friends, likes under /users/me/*
    await api.register(chatRoutes, { prefix: '/users/me/chats' }); // Chat routes

    // Faz 7: Notifications & Moderation
    await api.register(notificationsRoutes, { prefix: '/users' }); // User notifications under /users/me/notifications
    await api.register(broadcastRoutes, { prefix: '/notifications' }); // Broadcast under /notifications/broadcast
    await api.register(userReportRoutes, { prefix: '/users' }); // User reports under /users/me/reports
  }, { prefix: '/api/v1' });

  // Start background jobs
  startOrderExpirationJob();

  return app;
}
