import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './shared/config/index.js';
import { disconnectPrisma } from './shared/database/index.js';

async function start(): Promise<void> {
  const app = await buildApp();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);

      await app.close();
      await disconnectPrisma();

      app.log.info('Server closed');
      process.exit(0);
    });
  }

  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST
    });

    app.log.info(`Server running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`Environment: ${env.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
