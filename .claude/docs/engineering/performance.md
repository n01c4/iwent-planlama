# Performance and Optimization

## Query Optimization
Avoid N+1 queries:
```typescript
// Bad
const events = await prisma.event.findMany();
for (const event of events) {
  event.venue = await prisma.venue.findUnique({ where: { id: event.venueId } });
}

// Good
const events = await prisma.event.findMany({
  include: { venue: true, artists: true, ticketTypes: true }
});
```

Select only needed columns:
```typescript
const users = await prisma.user.findMany({
  select: { id: true, name: true, avatarUrl: true }
});
```

Always use pagination (cursor preferred):
```typescript
const events = await prisma.event.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastEventId },
  orderBy: { startDate: 'asc' }
});
```

## Caching Strategy (Three Layers)
```typescript
// CDN (CloudFlare)
const cdnCacheConfig = {
  staticAssets: '1 year',
  apiPublic: '5 minutes',
  apiAuth: 'no-cache'
};

// Redis
const redisCacheConfig = {
  'session:{userId}': '7d',
  'event:list:{city}:{page}': '5m',
  'event:detail:{id}': '10m',
  'search:{hash}': '10m',
  'analytics:{eventId}': '15m',
  'config:public': '1h'
};

// In-memory
const memoryCacheConfig = {
  categories: '1h',
  cities: '1h',
  config: '1h'
};
```

## Performance Targets
| Endpoint Category | P50 | P95 | P99 |
|-------------------|-----|-----|-----|
| Auth operations | <100ms | <200ms | <500ms |
| Simple GET (cached) | <30ms | <80ms | <150ms |
| Simple GET (db) | <50ms | <150ms | <300ms |
| Complex GET (joins) | <150ms | <400ms | <800ms |
| Search (full-text) | <100ms | <300ms | <600ms |
| NLP search | <500ms | <1500ms | <3000ms |
| POST/PUT/DELETE | <150ms | <350ms | <700ms |
| File upload (presign) | <50ms | <100ms | <200ms |
| Payment operations | <800ms | <2000ms | <5000ms |

## Indexing Guidelines
```sql
CREATE INDEX idx_events_city_date ON events(city, start_date)
  WHERE status = 'published';

CREATE INDEX idx_events_organizer ON events(organizer_id)
  WHERE status = 'published';

CREATE INDEX idx_tickets_user_status ON tickets(user_id, status);

CREATE INDEX idx_messages_chat_created ON messages(chat_room_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_friendships_users ON friendships(requester_id, addressee_id)
  WHERE status = 'accepted';

CREATE INDEX idx_events_search ON events
  USING GIN(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_events_upcoming ON events(start_date)
  WHERE status = 'published' AND start_date > NOW();
```

## Connection Pooling
```typescript
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
});

// Supabase limits: free ~60 connections, pro ~200.
// Use PgBouncer in production.
// Connection string example with pooling:
// DATABASE_URL="postgresql://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true"
```
