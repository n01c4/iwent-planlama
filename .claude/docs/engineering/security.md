# Security Guidelines

## Authentication (JWT)
```typescript
// Access token: 15 min TTL
const accessTokenConfig = { expiresIn: '15m', algorithm: 'HS256' };

// Refresh token: 7 days TTL with rotation
const refreshTokenConfig = { expiresIn: '7d', algorithm: 'HS256' };
```

Token validation on every request:
```typescript
app.addHook('preHandler', async (request) => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }

  const token = authHeader.substring(7);
  try {
    request.user = verifyAccessToken(token);
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      throw new UnauthorizedError('TOKEN_EXPIRED', 'Access token expired');
    }
    throw new UnauthorizedError();
  }
});
```

## Authorization
- Enforce resource ownership and role checks at the route or service layer.
- Use row-level policies where applicable.

Row Level Security example:
```sql
-- Users can only see their own orders
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Organizers can see orders for their events
CREATE POLICY orders_select_organizer ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = orders.event_id AND o.user_id = auth.uid()
    )
  );
```

Ownership middleware:
```typescript
async function requireOwnership(resourceType: string) {
  return async (request, reply) => {
    const resourceId = request.params.id;
    const userId = request.user.id;

    const isOwner = await checkOwnership(resourceType, resourceId, userId);
    if (!isOwner) {
      throw new ForbiddenError('NOT_OWNER', 'You do not own this resource');
    }
  };
}
```

## Input Validation
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(2).max(100).trim()
});

app.post('/users', {
  schema: { body: createUserSchema },
  preHandler: validateRequest
}, createUserHandler);
```

## SQL Injection Protection
```typescript
// Use Prisma ORM
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// If raw SQL is needed, parameterize it
const userSafe = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM users WHERE email = ${email}`
);
```

## Sensitive Data Handling
```typescript
// Logging with redaction
logger.info('User login', {
  userId: user.id,
  email: '[REDACTED]',
  password: undefined,
  ip: request.ip,
  userAgent: request.headers['user-agent']
});

// Remove secrets from responses
const safeUser = excludeSensitive(user, ['passwordHash', 'refreshToken']);
```

## Rate Limiting
```typescript
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute'
});

const rateLimits = {
  'auth:login': { max: 5, timeWindow: '1 minute' },
  'auth:register': { max: 3, timeWindow: '1 minute' },
  'auth:password-reset': { max: 3, timeWindow: '15 minutes' },
  'api:authenticated': { max: 300, timeWindow: '1 minute' },
  'orders:create': { max: 10, timeWindow: '1 minute' },
  'messages:send': { max: 30, timeWindow: '1 minute' },
  'stories:create': { max: 10, timeWindow: '1 hour' },
  'search:natural': { max: 20, timeWindow: '1 minute' }
};
```

## CORS
```typescript
await app.register(cors, {
  origin: [
    'https://app.iwent.com.tr',
    'https://org.iwent.com.tr',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000'
  ].filter(Boolean) as string[],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400
});
```

## Security Headers
```typescript
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});
```
