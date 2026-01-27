# iWent Backend Technical Roadmap

> **Versiyon:** 2.0  
> **Tarih:** Ocak 2026  
> **Platform:** Node.js Modular Monolith on Supabase

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Mimari Kararlar](#mimari-kararlar)
4. [Faz Planı](#faz-planı)
5. [API Endpoint Özeti](#api-endpoint-özeti)
6. [Veritabanı Şeması](#veritabanı-şeması)
7. [Güvenlik Stratejisi](#güvenlik-stratejisi)
8. [Performans Hedefleri](#performans-hedefleri)
9. [Test Stratejisi](#test-stratejisi)
10. [Deployment](#deployment)

---

## Genel Bakış

iWent, çok taraflı bir etkinlik biletleme platformudur:

| Aktör | Rol |
|-------|-----|
| **Kullanıcılar** | Etkinlik keşfi, bilet satın alma, sosyal etkileşim |
| **Organizatörler** | Etkinlik yönetimi, bilet satışı, analitik |
| **Sanatçılar** | Profil yönetimi, etkinlik katılımı |
| **Mekanlar** | Mekan bilgileri, etkinlik ev sahipliği |

### Temel Özellikler

```
┌─────────────────────────────────────────────────────────────────┐
│                         iWent Platform                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   User App      │   Organizer     │     Admin Panel             │
│                 │   Dashboard     │                             │
├─────────────────┴─────────────────┴─────────────────────────────┤
│                        REST API (Fastify)                       │
├─────────────────────────────────────────────────────────────────┤
│  Auth  │ Events │ Tickets │ Payments │ Chat │ Analytics │ AI   │
├─────────────────────────────────────────────────────────────────┤
│                    PostgreSQL (Supabase)                        │
│                    Redis (Cache/Queue)                          │
│                    S3 (Media Storage)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Teknoloji Stack

### Backend Core
| Teknoloji | Kullanım | Versiyon |
|-----------|----------|----------|
| **Node.js** | Runtime | 20+ LTS |
| **TypeScript** | Language | 5.x |
| **Fastify** | HTTP Framework | 4.x |
| **Prisma** | ORM | 5.x |
| **pnpm** | Package Manager | 8.x |

### Database & Storage
| Teknoloji | Kullanım |
|-----------|----------|
| **PostgreSQL** | Primary database (Supabase) |
| **Redis** | Cache, sessions, rate limiting |
| **Supabase Storage** | Media files (S3-compatible) |

### Infrastructure
| Teknoloji | Kullanım |
|-----------|----------|
| **Supabase** | Database hosting, Auth, Storage |
| **BullMQ** | Job queues |
| **WebSocket** | Real-time messaging |

### Integrations
| Servis | Kullanım |
|--------|----------|
| **iyzico / Stripe** | Payment processing |
| **Firebase** | Push notifications |
| **Gemini / OpenAI** | AI features |
| **SendGrid / Resend** | Email |

---

## Mimari Kararlar

### 1. Modular Monolith Yapısı

```
src/
├── modules/
│   ├── auth/           # Authentication & Authorization
│   ├── users/          # User management
│   ├── events/         # Event management
│   ├── venues/         # Venue management
│   ├── artists/        # Artist management
│   ├── tickets/        # Ticket & orders
│   ├── payments/       # Payment processing
│   ├── social/         # Friends, likes, chat
│   ├── notifications/  # Push, email, in-app
│   ├── analytics/      # Event analytics
│   ├── moderation/     # Content moderation
│   └── ai/             # AI-powered features
├── shared/
│   ├── database/       # Prisma client, migrations
│   ├── cache/          # Redis client
│   ├── queue/          # BullMQ setup
│   ├── middleware/     # Auth, rate-limit, etc.
│   └── utils/          # Helpers, validators
└── app.ts              # Fastify app setup
```

### 2. API Tasarım Prensipleri

- **REST-first**: Tüm endpointler REST standardında
- **Versioning**: `/api/v1/` prefix
- **Pagination**: Cursor-based (chat) + Offset-based (listeler)
- **Error Format**: `{ code, message, details }`
- **Authentication**: JWT Bearer tokens

### 3. Veritabanı Stratejisi

- **Row Level Security (RLS)**: Supabase native
- **Soft Delete**: `deleted_at` column
- **Audit Trail**: Kritik tablolarda `created_at`, `updated_at`
- **Denormalization**: Performance için (like_count, follower_count, etc.)

---

## Faz Planı

### 🔵 Faz 1: Foundation (MVP Auth & User)

**Hedef:** Temel authentication ve kullanıcı yönetimi

**Endpoints:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/verify/email`
- `GET /users/me`
- `PATCH /users/me`
- `GET /health`
- `GET /ready`
- `GET /config`

**Database Tables:**
- `users`
- `refresh_tokens`

**Deliverables:**
- [ ] JWT authentication (access + refresh)
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] User profile CRUD
- [ ] Rate limiting
- [ ] Basic error handling

---

### 🟢 Faz 2: Core Events

**Hedef:** Etkinlik, mekan ve sanatçı yönetimi

**Endpoints:**
- `GET /events`
- `GET /events/{id}`
- `GET /events/slug/{slug}`
- `GET /events/{id}/ticket-types`
- `GET /venues`
- `GET /venues/{id}`
- `GET /venues/slug/{slug}`
- `GET /venues/{id}/events`
- `GET /artists`
- `GET /artists/{id}`
- `GET /artists/slug/{slug}`
- `GET /artists/{id}/events`
- `GET /search`
- `GET /recommendations/discovery`

**Database Tables:**
- `categories`
- `venues`
- `artists`
- `events`
- `event_artists`
- `event_photos`
- `ticket_types`

**Deliverables:**
- [ ] Event listing with filters
- [ ] Full-text search (pg_trgm)
- [ ] Venue profiles
- [ ] Artist profiles
- [ ] Category management
- [ ] Event-Artist many-to-many
- [ ] Discovery feed algorithm

---

### 🟡 Faz 3: Organizer Tools

**Hedef:** Organizatör dashboard temel özellikleri

**Endpoints:**
- `GET /org/profile`
- `PATCH /org/profile`
- `GET /org/team`
- `POST /org/team`
- `PATCH /org/team/{id}`
- `DELETE /org/team/{id}`
- `GET /org/events`
- `POST /org/events`
- `GET /org/events/{id}`
- `PUT /org/events/{id}`
- `DELETE /org/events/{id}`
- `POST /org/events/{id}/publish`
- `POST /org/events/{id}/unpublish`
- `POST /org/events/{id}/duplicate`
- `GET /org/events/{id}/ticket-types`
- `POST /org/events/{id}/ticket-types`
- `PATCH /org/ticket-types/{id}`
- `DELETE /org/ticket-types/{id}`
- `GET /org/venues`
- `POST /org/venues`
- `PUT /org/venues/{id}`
- `DELETE /org/venues/{id}`
- `GET /org/artists`
- `POST /org/artists`
- `PUT /org/artists/{id}`
- `DELETE /org/artists/{id}`

**Database Tables:**
- `organizers`
- `team_members`

**Deliverables:**
- [ ] Organizer profile management
- [ ] Team member invitation
- [ ] Permission system
- [ ] Event CRUD with draft/publish flow
- [ ] Ticket type management
- [ ] Venue CRUD for organizers
- [ ] Artist CRUD for organizers
- [ ] Media upload (presigned URLs)

---

### 🟠 Faz 4: Ticketing & Payments

**Hedef:** Bilet satın alma ve ödeme altyapısı

**Endpoints:**
- `POST /orders`
- `GET /orders/{id}`
- `POST /orders/{id}/confirm`
- `POST /orders/{id}/cancel`
- `GET /users/me/orders`
- `GET /users/me/tickets`
- `GET /tickets/{id}`
- `POST /tickets/{id}/refund`
- `POST /tickets/{id}/transfer`
- `POST /payments/intent`
- `POST /payments/webhook`
- `GET /org/events/{id}/orders`
- `GET /org/orders/{id}`
- `POST /org/events/{id}/orders/{orderId}/refund`
- `GET /org/events/{id}/discount-codes`
- `POST /org/events/{id}/discount-codes`
- `POST /org/events/{id}/pricing-rules`

**Database Tables:**
- `orders`
- `order_items`
- `tickets`
- `discount_codes`
- `pricing_rules`
- `payment_webhooks`

**Deliverables:**
- [ ] Order creation with reservation
- [ ] Ticket inventory management (race conditions)
- [ ] Payment intent creation (iyzico/Stripe)
- [ ] Webhook handling
- [ ] Discount code application
- [ ] Dynamic pricing rules
- [ ] Refund processing
- [ ] Ticket transfer
- [ ] QR code generation

---

### 🔴 Faz 5: Social Features

**Hedef:** Arkadaşlık, mesajlaşma ve sosyal özellikler

**Endpoints:**
- `GET /users/me/friends`
- `GET /users/me/friends/requests`
- `POST /users/me/friends/requests`
- `POST /users/me/friends/requests/{id}` (accept/reject)
- `DELETE /users/me/friends/{id}`
- `POST /users/me/friends/{id}/block`
- `GET /users/me/blocked`
- `DELETE /users/me/blocked/{id}`
- `GET /users/{id}` (public profile)
- `GET /users/me/likes`
- `POST /users/me/likes`
- `DELETE /users/me/likes/{eventId}`
- `POST /artists/{id}/follow`
- `DELETE /artists/{id}/follow`
- `GET /users/me/following/artists`
- `GET /users/me/chats`
- `GET /users/me/chats/{id}/messages`
- `POST /users/me/chats/{id}/messages`
- `POST /users/me/chats/{id}/read`
- `GET /events/{id}/attendees`
- `GET /events/{id}/social`
- `GET /realtime` (WebSocket)

**Database Tables:**
- `friendships`
- `user_likes`
- `artist_followers`
- `chat_rooms`
- `chat_participants`
- `messages`

**Deliverables:**
- [ ] Friend request system
- [ ] Block/unblock users
- [ ] Event likes
- [ ] Artist following
- [ ] Event-based chat rooms
- [ ] Direct messaging (friends only)
- [ ] WebSocket real-time delivery
- [ ] Read receipts
- [ ] Unread count

---

### 🟣 Faz 6: Analytics & Check-in

**Hedef:** Analitik dashboard ve check-in sistemi

**Endpoints:**
- `GET /org/analytics/overview`
- `GET /org/analytics/events/{id}/timeseries`
- `GET /org/analytics/events/{id}/conversion`
- `GET /org/analytics/events/{id}/audience`
- `GET /org/analytics/events/{id}/top-sources`
- `GET /org/events/{id}/attendees`
- `POST /org/events/{id}/checkin`
- `POST /org/events/{id}/checkin/bulk`

**Database Tables:**
- `event_daily_stats`
- `event_conversion_stats`
- `event_traffic_sources`
- `event_audience_stats`

**Deliverables:**
- [ ] Revenue tracking
- [ ] Ticket sales metrics
- [ ] Conversion funnel
- [ ] Traffic source attribution
- [ ] Audience demographics
- [ ] Time series charts
- [ ] QR code check-in
- [ ] Bulk check-in
- [ ] Attendee search

---

### ⚫ Faz 7: Notifications & Moderation

**Hedef:** Bildirim sistemi ve içerik moderasyonu

**Endpoints:**
- `GET /users/me/notifications`
- `POST /users/me/notifications` (mark read)
- `POST /notifications/broadcast`
- `GET /org/moderation/reports`
- `POST /org/moderation/reports/{id}/action`
- `GET /org/moderation/chats`
- `GET /org/moderation/chats/{id}/messages`
- `POST /org/moderation/chats/{id}/action`
- `POST /org/moderation/filters`

**Database Tables:**
- `notifications`
- `reports`
- `moderation_filters`

**Deliverables:**
- [ ] Push notifications (Firebase)
- [ ] Email notifications
- [ ] In-app notifications
- [ ] Notification preferences
- [ ] Report system
- [ ] Chat moderation (freeze, clear)
- [ ] Word filters
- [ ] Spam protection

---

### ⚪ Faz 8: AI & Calendar

**Hedef:** AI özellikler ve takvim entegrasyonu

**Endpoints:**
- `POST /ai/events/description`
- `POST /ai/events/visual`
- `POST /ai/events/copy-variants`
- `GET /users/me/calendar`
- `GET /calendar/feeds/ics`

**Deliverables:**
- [ ] AI description generation (Gemini)
- [ ] AI visual generation (DALL-E/Stable Diffusion)
- [ ] Marketing copy variants
- [ ] ICS calendar feed
- [ ] Calendar view for users

---

## API Endpoint Özeti

| Kategori | Endpoint Sayısı |
|----------|-----------------|
| Auth | 7 |
| Users | 6 |
| Social (Friends) | 10 |
| Events | 6 |
| Venues | 5 |
| Artists | 7 |
| Discovery | 2 |
| Orders | 4 |
| Tickets | 3 |
| Payments | 2 |
| Chats | 4 |
| Calendar | 2 |
| Organizer Profile | 6 |
| Organizer Events | 12 |
| Organizer Venues | 4 |
| Organizer Artists | 4 |
| Organizer Media | 3 |
| Organizer Tickets | 4 |
| Organizer Pricing | 3 |
| Organizer Orders | 7 |
| Analytics | 5 |
| Moderation | 6 |
| AI | 3 |
| Notifications | 2 |
| Realtime | 1 |
| System | 4 |
| **TOPLAM** | **~120** |

---

## Veritabanı Şeması

### Entity Relationship Overview

```
┌─────────┐     ┌───────────┐     ┌────────┐
│  Users  │────<│ Friendships│>────│ Users  │
└────┬────┘     └───────────┘     └────────┘
     │
     ├──────────────┬─────────────────┐
     │              │                 │
┌────▼────┐   ┌────▼─────┐     ┌─────▼─────┐
│ Orders  │   │ Tickets  │     │ UserLikes │
└────┬────┘   └────┬─────┘     └─────┬─────┘
     │              │                 │
     │         ┌────▼─────┐          │
     │         │  Events  │◄─────────┘
     │         └────┬─────┘
     │              │
     │    ┌─────────┼─────────┐
     │    │         │         │
┌────▼────▼──┐ ┌───▼────┐ ┌──▼──────┐
│TicketTypes │ │ Venues │ │ Artists │
└────────────┘ └────────┘ └─────────┘
```

### Tablo Sayıları

| Schema | Tablo Sayısı |
|--------|--------------|
| Core (users, auth) | 3 |
| Events | 8 |
| Social | 7 |
| Orders/Tickets | 4 |
| Pricing | 2 |
| Analytics | 4 |
| Moderation | 2 |
| System | 2 |
| **TOPLAM** | **~32** |

---

## Güvenlik Stratejisi

### Authentication
- **JWT Access Token**: 15 dakika TTL
- **Refresh Token**: 7 gün TTL, rotation
- **Password**: Argon2 hashing
- **2FA**: TOTP (gelecek)

### Authorization
- **Role-based**: public, user, organizer, admin
- **Resource ownership**: RLS policies
- **API scopes**: Per-endpoint checks

### Rate Limiting
```typescript
{
  public: '100/minute',
  authenticated: '300/minute',
  search: '60/minute',
  orders: '10/minute',
  auth: '5/minute'
}
```

### Input Validation
- **Zod** schema validation
- **Sanitization**: XSS prevention
- **File upload**: Type & size limits

### Row Level Security (RLS)
```sql
-- Kullanıcılar sadece kendi verilerini görebilir
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Mesajlar sadece katılımcılara görünür
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_room_id = messages.chat_room_id
      AND user_id = auth.uid()
    )
  );
```

---

## Performans Hedefleri

### API Response Times
| Endpoint Type | P50 | P95 | P99 |
|---------------|-----|-----|-----|
| Simple GET | <50ms | <100ms | <200ms |
| Complex GET | <150ms | <300ms | <500ms |
| Search | <100ms | <250ms | <500ms |
| POST/PUT | <100ms | <200ms | <400ms |
| Payment | <500ms | <1s | <2s |

### Database
- Connection pooling: PgBouncer
- Query optimization: EXPLAIN ANALYZE
- Indexes: ~50+ strategic indexes
- Caching: Redis L2 cache

### Caching Strategy
```
┌─────────────────────────────────────────┐
│  Layer 1: CDN (Static, 1 year)          │
├─────────────────────────────────────────┤
│  Layer 2: Redis (API, 5-60 min)         │
│  - Popular events list                  │
│  - User sessions                        │
│  - Rate limit counters                  │
├─────────────────────────────────────────┤
│  Layer 3: Database (Materialized Views) │
│  - Analytics aggregates                 │
│  - Leaderboards                         │
└─────────────────────────────────────────┘
```

---

## Test Stratejisi

### Test Piramidi
```
        ┌───────────┐
        │   E2E     │  10%
        │  (Detox)  │
       ─┴───────────┴─
      ┌───────────────┐
      │  Integration  │  20%
      │  (Supertest)  │
     ─┴───────────────┴─
    ┌───────────────────┐
    │     Unit Tests    │  70%
    │     (Vitest)      │
    └───────────────────┘
```

### Coverage Targets
| Kategori | Target |
|----------|--------|
| Unit | >80% |
| Integration | >60% |
| Critical Paths | 100% |

### Test Kategorileri
- **Unit**: Business logic, utilities
- **Integration**: API endpoints, database
- **E2E**: Critical user journeys
- **Performance**: Load testing (k6)
- **Security**: OWASP checks

---

## Deployment

### Environment Strategy
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Development │────>│   Staging    │────>│  Production  │
│  (local)     │     │  (preview)   │     │  (main)      │
└──────────────┘     └──────────────┘     └──────────────┘
```

### CI/CD Pipeline
1. **Lint & Type Check** (Biome/ESLint)
2. **Unit Tests** (Vitest)
3. **Build** (tsc)
4. **Integration Tests** (Supertest)
5. **Security Scan** (npm audit, Snyk)
6. **Deploy to Staging**
7. **E2E Tests**
8. **Manual Approval** (production)
9. **Deploy to Production** (blue-green)

### Monitoring
- **Logs**: Pino → Loki
- **Metrics**: Prometheus → Grafana
- **Traces**: OpenTelemetry → Jaeger
- **Alerts**: PagerDuty/Slack
- **Uptime**: Better Uptime / Checkly

---

## Sonraki Adımlar

### Immediately (This Sprint)
1. ✅ Database schema finalization
2. ✅ OpenAPI specification
3. ⬜ Project scaffolding (Fastify + TypeScript)
4. ⬜ Prisma setup with migrations
5. ⬜ Auth module implementation

### Short-term (Next 2 Sprints)
- Core Events module
- Basic organizer tools
- Supabase deployment

### Medium-term (1-2 Months)
- Ticketing & Payments
- Social features
- Real-time chat

### Long-term (3+ Months)
- Analytics dashboard
- AI features
- Mobile app integration

---

## Appendix

### Useful Commands
```bash
# Development
pnpm dev              # Start dev server
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm test             # Run tests

# Production
pnpm build            # Build for production
pnpm start            # Start production server
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Redis
REDIS_URL=redis://...

# Payments
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...

# Storage
SUPABASE_URL=...
SUPABASE_KEY=...

# AI
GEMINI_API_KEY=...
```

---

*Son güncelleme: Ocak 2026*
