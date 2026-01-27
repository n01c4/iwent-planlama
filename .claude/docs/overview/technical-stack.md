# Technical Stack

Keep these technology choices fixed unless explicitly approved to change.

## Fixed Decisions (Do Not Change)
| Technology | Choice | Reason |
|------------|--------|--------|
| Backend Framework | Fastify + TypeScript | High performance, type-safe. |
| ORM | Prisma | Type-safe queries, migration management. |
| Database | PostgreSQL (Supabase) | Managed, scalable. |
| Authentication | JWT | Stateless, fine-grained control. |
| Real-time | Supabase Realtime | WebSocket + CDC. |
| File Storage | Supabase Storage | S3-compatible with integrated auth. |
| Architecture | Modular Monolith | Simple to start; can split later. |

## Changeable Decisions
You can suggest alternatives with trade-offs.

| Topic | Current Option | Alternatives |
|-------|----------------|--------------|
| Email Provider | TBD | SendGrid, Resend, AWS SES |
| Image Optimization | TBD | Sharp, Cloudinary |
| AI Provider | Gemini | OpenAI |
| Error Tracking | TBD | Sentry, Rollbar |
| APM | TBD | New Relic, DataDog |

## Version Requirements
```json
{
  "node": ">=20.0.0",
  "typescript": ">=5.0.0",
  "prisma": ">=5.0.0",
  "fastify": ">=4.0.0"
}
```
