import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './shared/config/index.js';
import { errorHandler } from './shared/middleware/index.js';

// Module imports
import { authRoutes } from './modules/auth/index.js';
import { usersRoutes } from './modules/users/index.js';

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
    // Auth module
    await api.register(authRoutes, { prefix: '/auth' });

    // Users module
    await api.register(usersRoutes, { prefix: '/users' });
  }, { prefix: '/api/v1' });

  return app;
}
