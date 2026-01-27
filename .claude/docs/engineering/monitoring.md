# Monitoring and Alerting

## Health Checks
```typescript
// /health
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memory: {
    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
  },
  checks: {
    database: await checkDatabase(),
    redis: await checkRedis(),
    supabase: await checkSupabase()
  }
}));

// /ready for readiness probes
app.get('/ready', async () => {
  const checks = await Promise.all([checkDatabase(), checkRedis()]);
  const allReady = checks.every((c) => c.status === 'ok');
  if (!allReady) {
    throw new ServiceUnavailableError('Service not ready');
  }
  return { status: 'ready' };
});
```

## Metrics (Prometheus Style)
```typescript
const metrics = {
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status']
  }),
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'path'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
  }),
  dbQueryDuration: new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query duration',
    labelNames: ['operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1]
  }),
  dbConnectionsActive: new Gauge({
    name: 'db_connections_active',
    help: 'Active database connections'
  }),
  ticketsSoldTotal: new Counter({
    name: 'tickets_sold_total',
    help: 'Total tickets sold',
    labelNames: ['eventId']
  }),
  ordersCreatedTotal: new Counter({
    name: 'orders_created_total',
    help: 'Total orders created',
    labelNames: ['status']
  }),
  activeWebsocketConnections: new Gauge({
    name: 'active_websocket_connections',
    help: 'Active WebSocket connections'
  })
};
```

## Alerting Rules
| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High error rate | error_rate > 1% (5m) | Critical | PagerDuty + Slack |
| High latency | P95 > 2s (5m) | Warning | Slack |
| DB pool usage | pool_usage > 80% | Warning | Slack |
| Memory usage | memory > 85% | Warning | Slack |
| Disk usage | disk > 80% | Warning | Slack |
| Payment failures | failure_rate > 5% (15m) | Critical | PagerDuty |
| Zero ticket sales | sales = 0 (1h, biz hours) | Warning | Slack |
| WebSocket disconnects | disconnect_rate > 10% (5m) | Warning | Slack |
| API down | health_check_fail (1m) | Critical | PagerDuty |

## Error Tracking (Sentry)
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Prisma({ client: prisma }),
    new Sentry.Integrations.Http({ tracing: true })
  ],
  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  }
});

app.addHook('onRequest', (request, reply, done) => {
  Sentry.setUser({ id: request.user?.id, role: request.user?.role });
  done();
});

app.setErrorHandler((error, request, reply) => {
  Sentry.captureException(error, {
    tags: { module: extractModule(request.url), method: request.method },
    extra: { requestId: request.id, body: request.body }
  });
  // Continue with normal error handling...
});
```
