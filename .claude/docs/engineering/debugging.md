# Debugging and Troubleshooting

## Log Levels
```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: { level: (label) => ({ level: label }) },
  redact: ['password', 'token', 'authorization', 'cookie', 'refreshToken']
});

logger.fatal('Application crash', { error });
logger.error('Critical error', { error, stack });
logger.warn('Warning', { context });
logger.info('Info', { action, userId });
logger.debug('Debug', { data });
logger.trace('Trace', { detail });
```

## Request Logging
```typescript
app.addHook('onRequest', async (request) => {
  request.log.info({
    method: request.method,
    url: request.url,
    requestId: request.id,
    userId: request.user?.id
  }, 'Incoming request');
});

app.addHook('onResponse', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: reply.getResponseTime()
  }, 'Request completed');
});

app.addHook('onError', async (request, reply, error) => {
  request.log.error({
    method: request.method,
    url: request.url,
    error: (error as Error).message,
    stack: (error as Error).stack
  }, 'Request error');
});
```

## Common Errors
| Error | Possible Cause | Solution |
|-------|----------------|----------|
| Prisma P2002 | Unique constraint violation | Add duplicate checks or upsert. |
| Prisma P2025 | Record not found | Add findUnique null checks. |
| TokenExpiredError | JWT expired | Verify refresh token flow. |
| RateLimitExceeded | Too many requests | Raise limits carefully or cache. |
| ConnectionPoolExhausted | Too many DB connections | Use PgBouncer, tune pool size. |
| ECONNREFUSED | Database/service down | Add health checks and retry logic. |

## Database Debugging
```bash
npx prisma studio             # view DB
DEBUG="prisma:query" pnpm dev # query logging
DEBUG="prisma:query,prisma:info" pnpm dev # slow query logging
npx prisma migrate status     # migration status
npx prisma validate           # schema validation
```

## Memory Leak Detection
```typescript
setInterval(() => {
  const usage = process.memoryUsage();
  logger.debug({
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB',
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB'
  }, 'Memory usage');
}, 60000);
```

## Debugging Tips
1. Use the structured logger instead of console.log.
2. Add and propagate request IDs for correlation.
3. Always capture and log stack traces.
4. Redact sensitive data in logs.
5. Log objects, not concatenated strings.
