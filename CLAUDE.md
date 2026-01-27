# iWent Backend - CLAUDE.md

> **Version:** 1.0
> **Last Updated:** January 2026
> **Project:** iWent Backend API

This file defines how Claude Code works with the iWent Backend project, what rules to follow, and what references to use.

---

## Quick Reference

```
📖 Read first: iwent-summary.txt
📋 PRD: iWent_Backend_PRD.md
🗄️ Database: iwent_database_schema_v2.sql
🔌 API: iwent_openapi_v2.yaml
🗺️ Roadmap: iWent_Technical_Roadmap.md
```

---

## Table of Contents

1. [Project Context and Vision](#1-project-context-and-vision)
2. [Technical Stack](#2-technical-stack)
3. [File References](#3-file-references)
4. [Execution Rules](#4-execution-rules)
5. [Task Management](#5-task-management)
6. [Things NOT To Do](#6-things-not-to-do)
7. [Test Strategy](#7-test-strategy)
8. [Code Style & Conventions](#8-code-style--conventions)
9. [Security Guidelines](#9-security-guidelines)
10. [Debugging & Troubleshooting](#10-debugging--troubleshooting)
11. [Deployment & DevOps](#11-deployment--devops)
12. [Performance & Optimization](#12-performance--optimization)
13. [Monitoring & Alerting](#13-monitoring--alerting)
14. [Workflow Examples](#14-workflow-examples)

---

## 1. Project Context and Vision

### 1.1 What is iWent?

iWent is a mobile event ticketing platform that transforms event participation into social interaction. The platform creates meaningful connections between participants before and after events, turning the event experience into an ecosystem where strong social bonds can form.

### 1.2 Philosophy

> **"Don't stare at the screen, even if it's iWent"** - collect moments, meaning, and friends

This philosophy is reflected in every decision of the platform:
- Directing users to the real world
- Building meaningful connections
- Not creating digital addiction
- Supporting collective experiences

### 1.3 Core Values

| Value | Description |
|-------|-------------|
| **Meaningful Connections** | Real friendships instead of superficial social media |
| **Digital Balance** | Healthy digital life, not platform addiction |
| **Discoverability** | Everything is clickable, democratic access to information |
| **Collective Experience** | Community-focused events, not individual |

### 1.4 File You Must Read First

```
📖 READ BEFORE STARTING ANY WORK:
iwent-summary.txt
```

This file:
- Explains the product vision
- Defines platform philosophy
- Lists main features
- Describes what problems it solves

**Make all your decisions aligned with this vision!**

### 1.5 User Types

| Type | Description | MVP |
|------|-------------|-----|
| **User** | End users (participants) | ✅ |
| **Organizer** | Event organizers | ✅ |
| **Admin** | Platform administrators | ❌ Post-MVP |

**Important**: There are only these 3 user types. Do NOT add new types!

### 1.6 Frontend Applications

| Frontend | User | MVP |
|----------|------|-----|
| `iwent-welcome-screen` | Users | ✅ |
| `iwent-organizator-paneli` | Organizers | ✅ |
| `iwent-admin-panel` | Admins | ❌ |

---

## 2. Technical Stack

### 2.1 Fixed Decisions (DO NOT CHANGE!)

These technology decisions are **finalized**, do NOT propose changes:

| Technology | Choice | Reason |
|------------|--------|--------|
| **Backend Framework** | Fastify + TypeScript | High performance, type-safe |
| **ORM** | Prisma | Type-safe queries, migration management |
| **Database** | PostgreSQL (Supabase) | Managed, scalable |
| **Authentication** | JWT | Stateless, fine-grained control |
| **Real-time** | Supabase Realtime | WebSocket + CDC |
| **File Storage** | Supabase Storage | S3-compatible, integrated auth |
| **Architecture** | Modular Monolith | Simple to start, can split later |

### 2.2 Changeable Decisions

You can make suggestions on these topics:

| Topic | Current Option | Alternatives |
|-------|----------------|--------------|
| Email Provider | TBD | SendGrid, Resend, AWS SES |
| Image Optimization | TBD | Sharp, Cloudinary |
| AI Provider | Gemini | OpenAI |
| Error Tracking | TBD | Sentry, Rollbar |
| APM | TBD | New Relic, DataDog |

### 2.3 Version Requirements

```json
{
  "node": ">=20.0.0",
  "typescript": ">=5.0.0",
  "prisma": ">=5.0.0",
  "fastify": ">=4.0.0"
}
```

---

## 3. File References

### 3.1 Files to Read for Each Task Type

| Task Type | Files to Read |
|-----------|---------------|
| **General Context** | `iwent-summary.txt`, `iWent_Backend_PRD.md` |
| **API Development** | `iwent_openapi_v2.yaml`, `openapi_v3_additions.yaml` |
| **Database Change** | `iwent_database_schema_v2.sql` |
| **New Feature** | `iWent_Technical_Roadmap.md`, related `.txt` files |
| **Organizer Features** | `organizer-dashboard.txt` |
| **User Features** | `homepage.txt`, `profile.txt`, `friends.txt`, `chats.txt` |
| **Settings** | `settings.txt` |
| **Philosophy/UX Decisions** | `clickablility-and-modular-database.txt` |
| **Search Features** | `side-features.txt` |

### 3.2 Frontend Feature Files

```
iwent-planlama/
├── chats.txt                    # Chat features
├── friends.txt                  # Friendship system
├── homepage.txt                 # Homepage (discovery, search)
├── profile.txt                  # User profile
├── settings.txt                 # Settings
├── organizer-dashboard.txt      # Organizer features
├── side-features.txt            # Natural language search etc.
└── clickablility-and-modular-database.txt  # Clickability philosophy
```

### 3.3 Technical Documents

```
iwent-planlama/
├── iWent_Backend_PRD.md         # Comprehensive Backend PRD
├── iwent_database_schema_v2.sql # Database schema (v3 updates included)
├── iwent_openapi_v2.yaml        # Current API spec
├── openapi_v3_additions.yaml    # v3 new endpoints
├── iWent_Technical_Roadmap.md   # Implementation roadmap
└── iwent-summary.txt            # Product vision
```

### 3.4 Expected Project Structure

```
iwent-backend/
├── prisma/
│   └── schema.prisma           # Database schema (Prisma)
├── src/
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.test.ts
│   │   ├── users/              # User management
│   │   ├── events/             # Event management
│   │   ├── tickets/            # Ticketing
│   │   ├── orders/             # Orders & payments
│   │   ├── social/             # Friends, stories, chat
│   │   │   ├── friends/
│   │   │   ├── stories/
│   │   │   └── chat/
│   │   ├── venues/             # Venues
│   │   ├── artists/            # Artists
│   │   └── org/                # Organizer features
│   │       ├── events/
│   │       ├── team/
│   │       ├── analytics/
│   │       └── moderation/
│   ├── shared/                 # Shared utilities
│   │   ├── middleware/         # Auth, rate limiting, error handling
│   │   ├── validators/         # Zod schemas
│   │   ├── errors/             # Custom error classes
│   │   ├── utils/              # Utility functions
│   │   └── types/              # Shared types
│   ├── config/                 # Configuration
│   └── app.ts                  # Application entry
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/                       # Documentation
└── scripts/                    # Utility scripts
```

---

## 4. Execution Rules

### 4.1 ABSOLUTE RULE: Double Verification

**ALWAYS** check and get approval before execution!

### 4.2 Approval Levels

#### Level 1: Simple Changes ✅
**No approval needed, just inform**

Examples:
- Typo fixes
- Adding/updating comments
- Import sorting
- Formatting fixes
- Single line bug fixes

Format:
```
📝 Simple change: Making Y fix in X file.
```

---

#### Level 2: Medium-Level Changes ⚠️
**Approval required**

Examples:
- Adding new endpoint
- Adding new column (non-breaking)
- Logic changes
- New service/utility function
- Adding tests

Format:
```
⚠️ APPROVAL REQUIRED

Change I want to make:
- [Change description]

Affected files:
- [File list]

Potential impacts:
- [Are there breaking changes?]
- [Is migration needed?]
- [Is frontend affected?]

Should I proceed?
```

---

#### Level 3: Critical Changes 🔴
**Detailed approval mandatory**

Examples:
- Database migration
- API breaking change
- Security changes
- Authentication/authorization changes
- Payment logic changes
- Data deletion

Format:
```
🔴 CRITICAL APPROVAL REQUIRED

Change I want to make:
- [Detailed description]

This change affects:
- Database: [Yes/No] - Is migration needed?
- API: [Yes/No] - Is it a breaking change?
- Frontend: [Yes/No] - Is compatibility change needed?
- Security: [Yes/No] - Is security review needed?
- Payment: [Yes/No] - Is payment flow affected?

Rollback plan:
- [How to revert]

Do you approve this change?
```

### 4.3 Special Cases

#### BEFORE Doing Database Migration
1. Read current schema: `iwent_database_schema_v2.sql`
2. Check Prisma schema
3. Show migration script and get approval
4. Prepare rollback script
5. Run after getting approval

#### BEFORE Changing API Endpoint
1. Check OpenAPI spec: `iwent_openapi_v2.yaml`
2. Check if it's a breaking change
3. Evaluate frontend impact
4. Determine deprecation strategy
5. Get approval

#### For EVERY Security-Related Change
1. Explain the change in detail
2. List potential security risks
3. Do OWASP Top 10 check
4. NEVER change without approval

#### For Payment/Order Related Changes
1. Document current flow
2. Do race condition analysis
3. Check transaction isolation
4. Determine rollback scenarios
5. Get approval

### 4.4 In Case of Uncertainty

If there's uncertainty about something:
- **Don't assume, ASK!**
- Present options to user
- Explain trade-offs of each option
- Continue after getting approval

---

## 5. Task Management

### 5.1 Task Breakdown Strategy

Follow these steps when you receive a big task:

#### Phase 1: Analysis (Readonly)
```
1. Read related files
2. Understand current implementation
3. Identify dependencies
4. Detect potential issues
```

#### Phase 2: Planning
```
1. Break task into subtasks
2. For each subtask:
   - Description
   - Affected files
   - Dependencies
   - Complexity (Simple/Medium/Complex)
3. Determine order
4. Identify critical path
```

#### Phase 3: Approval
```
1. Show plan to user
2. Get feedback
3. Revise if needed
4. Get approval
```

#### Phase 4: Execution
```
1. Do each subtask in order
2. Report progress after each step
3. Stop and ask if issues arise
4. Write and run tests
```

### 5.2 TodoWrite Usage

**ALWAYS** use TodoWrite tool:
- For tasks requiring 2+ steps
- In complex feature implementations
- Even in bug fixes (root cause → fix → test)

Example Todo List:
```
1. [ ] Examine current implementation
2. [ ] Prepare database migration script
3. [ ] Update Prisma schema
4. [ ] Repository layer implementation
5. [ ] Service layer implementation
6. [ ] Create Controller/Route handler
7. [ ] Add validation schema
8. [ ] Write unit tests
9. [ ] Write integration tests
10. [ ] Update documentation
```

### 5.3 Progress Reporting

Use this format after each major step:

```
✅ [Completed step]
📍 Currently: [Current step]
⏳ Remaining: [Number of remaining steps]

Progress: ████████░░ 80%
```

### 5.4 Intermediate Approval for Complex Tasks

Every 3-4 steps in long-running tasks:
```
📊 INTERIM STATUS REPORT

Completed:
- [List]

In progress:
- [List]

Pending:
- [List]

Any issues: [Yes/No]
[Explanation if yes]

Should I continue?
```

---

## 6. Things NOT To Do

### 6.1 Absolute Prohibitions ⛔

#### 1. Changing Technical Stack
```
❌ Suggesting different auth instead of JWT
❌ Suggesting different DB instead of Supabase
❌ Suggesting different framework instead of Fastify
❌ Suggesting different ORM instead of Prisma
```

#### 2. Adding User Types
```
❌ Only 3 types exist: User, Organizer, Admin
❌ Adding new user types
❌ Adding sub-types or roles (outside RBAC)
```

#### 3. Admin Panel Backend (MVP)
```
❌ Admin panel is outside MVP scope
❌ Creating admin endpoints
❌ Adding admin-only features
```

#### 4. Frontend Changes
```
❌ Backend changes that alter frontend logic
❌ API changes that break frontend flow
❌ Breaking changes without informing frontend
```

#### 5. Unapproved Critical Operations
```
❌ Database migration (without approval)
❌ API breaking change (without approval)
❌ Security change (without approval)
❌ Production deployment (without approval)
❌ Data deletion (without approval)
```

#### 6. Security Vulnerabilities
```
❌ Code that risks SQL injection
❌ XSS vulnerability
❌ CSRF unprotected endpoint
❌ Hardcoded credentials
❌ Logging sensitive data (password, token, PII)
❌ Open CORS policy
```

### 6.2 Things to Be Careful About ⚠️

#### 1. Over-engineering
```
⚠️ Adding unnecessary abstraction
⚠️ Unused utility functions
⚠️ "Might need it in the future" code
⚠️ Premature optimization
⚠️ Overly generic solutions
```

**Rule**: YAGNI (You Aren't Gonna Need It)

#### 2. Scope Creep
```
⚠️ Adding unrequested features
⚠️ "I also did this as a bonus"
⚠️ Feature inflation
⚠️ Unrelated improvements
```

**Rule**: Only do what's requested, add extras by asking

#### 3. Skipping Tests
```
⚠️ "I'll write tests later"
⚠️ Only happy path tests
⚠️ Missing integration tests
⚠️ Skipping edge cases
```

**Rule**: Code is not complete without tests

#### 4. Missing Documentation
```
⚠️ Not writing JSDoc/TSDoc
⚠️ Not updating README
⚠️ Not reflecting API changes in documentation
```

---

## 7. Test Strategy

### 7.1 Test Pyramid

```
           /\
          /  \      E2E Tests
         /    \     (few, critical flows)
        /------\
       /        \   Integration Tests
      /          \  (medium, API layer)
     /------------\
    /              \ Unit Tests
   /                \(many, business logic)
  /------------------\
```

### 7.2 Test Tools

| Tool | Use Case |
|------|----------|
| **Vitest** | Unit tests, fast, modern |
| **Supertest** | HTTP integration tests |
| **@prisma/client/mock** | Database mock |
| **MSW** | External API mock |
| **Faker.js** | Test data generation |

### 7.3 Test Writing Rules

#### Unit Test Example
```typescript
// ✅ CORRECT
describe('TicketService', () => {
  describe('calculatePrice', () => {
    it('should apply early bird discount when within date range', () => {
      // Arrange
      const basePrice = 100;
      const rule: PricingRule = {
        type: 'early_bird',
        discountPercent: 20,
        validUntil: new Date('2026-02-01')
      };
      const purchaseDate = new Date('2026-01-15');

      // Act
      const price = calculatePrice(basePrice, rule, purchaseDate);

      // Assert
      expect(price).toBe(80);
    });

    it('should NOT apply early bird discount when outside date range', () => {
      // Arrange
      const basePrice = 100;
      const rule: PricingRule = {
        type: 'early_bird',
        discountPercent: 20,
        validUntil: new Date('2026-01-10')
      };
      const purchaseDate = new Date('2026-01-15');

      // Act
      const price = calculatePrice(basePrice, rule, purchaseDate);

      // Assert
      expect(price).toBe(100); // No discount
    });
  });
});

// ❌ WRONG
test('test1', () => {
  expect(fn()).toBeTruthy();
});
```

#### Integration Test Example
```typescript
describe('POST /api/v1/orders', () => {
  let app: FastifyInstance;
  let testUser: User;
  let testEvent: Event;
  let testToken: string;

  beforeAll(async () => {
    app = await buildApp();
    testUser = await createTestUser();
    testEvent = await createTestEvent();
    testToken = generateTestToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  it('should create order with valid ticket', async () => {
    // Execute
    const response = await request(app.server)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        eventId: testEvent.id,
        items: [{ ticketTypeId: testEvent.ticketTypes[0].id, quantity: 2 }]
      });

    // Verify
    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('pending');
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity).toBe(2);
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app.server)
      .post('/api/v1/orders')
      .send({ eventId: testEvent.id, items: [] });

    expect(response.status).toBe(401);
  });

  it('should return 400 with invalid event ID', async () => {
    const response = await request(app.server)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        eventId: 'invalid-uuid',
        items: []
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### 7.4 Test Coverage Targets

| Module | Minimum Coverage |
|--------|------------------|
| Auth | 90% |
| Orders/Payments | 90% |
| Tickets | 85% |
| Social (Friends, Chat) | 80% |
| Stories | 80% |
| Events | 80% |
| Analytics | 70% |
| Moderation | 70% |

### 7.5 When to Write Tests

| Situation | Test Strategy |
|-----------|---------------|
| **New feature** | TDD or together with implementation |
| **Bug fix** | First failing test, then fix |
| **Refactoring** | Update existing tests |
| **Security fix** | Must add security tests |
| **Performance fix** | Add benchmark tests |

### 7.6 Test Running Commands

```bash
# All tests
pnpm test

# Watch mode (development)
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific module
pnpm test -- --filter=auth

# Specific file
pnpm test -- src/modules/auth/auth.test.ts

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

### 7.7 Test Data Management

```typescript
// fixtures/users.ts
export const createTestUser = async (overrides?: Partial<User>): Promise<User> => {
  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      passwordHash: await hash('TestPassword123!'),
      ...overrides
    }
  });
};

// Cleanup after each test
afterEach(async () => {
  await prisma.order.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});
```

---

## 8. Code Style & Conventions

### 8.1 File Naming

```
feature.controller.ts   # Route handlers
feature.service.ts      # Business logic
feature.repository.ts   # Database operations
feature.schema.ts       # Zod validation schemas
feature.types.ts        # TypeScript types/interfaces
feature.test.ts         # Test files
feature.constants.ts    # Constants
feature.utils.ts        # Utility functions
```

### 8.2 Folder Structure (Module)

```
src/modules/tickets/
├── tickets.controller.ts
├── tickets.service.ts
├── tickets.repository.ts
├── tickets.schema.ts
├── tickets.types.ts
├── tickets.test.ts
├── tickets.constants.ts
└── index.ts            # Public exports
```

### 8.3 Function Naming

```typescript
// Controller (HTTP action based)
export async function createTicket(req, reply) { ... }
export async function getTicket(req, reply) { ... }
export async function updateTicket(req, reply) { ... }
export async function deleteTicket(req, reply) { ... }
export async function listTickets(req, reply) { ... }

// Service (business action based)
export class TicketService {
  async purchaseTicket(userId, ticketTypeId) { ... }
  async findTicketById(id) { ... }
  async findTicketsByUser(userId) { ... }
  async transferTicket(ticketId, toUserId) { ... }
  async giftTicket(ticketId, toUserId, message) { ... }
  async refundTicket(ticketId, reason) { ... }
}

// Repository (CRUD based)
export class TicketRepository {
  async insert(data) { ... }
  async findById(id) { ... }
  async findMany(filter) { ... }
  async update(id, data) { ... }
  async delete(id) { ... }
}
```

### 8.4 Error Handling Pattern

```typescript
// errors/custom-errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code: string = 'UNAUTHORIZED', message: string = 'Unauthorized') {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: string = 'FORBIDDEN', message: string = 'Forbidden') {
    super(code, message, 403);
  }
}

// Service layer usage
class TicketService {
  async findById(id: string): Promise<Ticket> {
    const ticket = await this.repo.findById(id);
    if (!ticket) {
      throw new NotFoundError('TICKET_NOT_FOUND', `Ticket ${id} not found`);
    }
    return ticket;
  }
}

// Global error handler
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  // Unexpected error
  logger.error({ error }, 'Unhandled error');
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

### 8.5 API Response Format

```typescript
// Success Response
interface SuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Example
{
  "data": {
    "id": "123",
    "title": "Concert",
    "startDate": "2026-02-15T20:00:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error Response
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Example
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Password too short" }
    ]
  }
}
```

### 8.6 Commit Convention

```
type(scope): description

Types:
- feat:     New feature
- fix:      Bug fix
- refactor: Code restructuring (functionality unchanged)
- docs:     Documentation
- test:     Adding/updating tests
- chore:    Build, config changes
- perf:     Performance improvement
- style:    Formatting, linting

Scopes:
- auth, users, events, tickets, orders
- social, friends, stories, chat
- venues, artists
- org, analytics, moderation
- payments, notifications
- config, deps, ci

Examples:
feat(social): add user stories endpoints
fix(tickets): handle race condition in purchase flow
refactor(auth): extract token validation to middleware
docs(api): update OpenAPI spec for v3 endpoints
test(orders): add integration tests for refund flow
chore(deps): update prisma to v5.8.0
```

### 8.7 TypeScript Best Practices

```typescript
// ✅ CORRECT: Explicit return types
async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ WRONG: Implicit any
async function findUser(id) {
  return prisma.user.findUnique({ where: { id } });
}

// ✅ CORRECT: Use unknown instead of any
function parseJson(data: unknown): Record<string, unknown> {
  if (typeof data !== 'string') {
    throw new Error('Expected string');
  }
  return JSON.parse(data);
}

// ✅ CORRECT: Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

// ✅ CORRECT: Const assertions
const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
```

---

## 9. Security Guidelines

### 9.1 Authentication

#### JWT Configuration
```typescript
// Access token: 15 min TTL
const accessTokenConfig = {
  expiresIn: '15m',
  algorithm: 'HS256'
};

// Refresh token: 7 days TTL, auto-rotation
const refreshTokenConfig = {
  expiresIn: '7d',
  algorithm: 'HS256'
};
```

#### Token Validation
```typescript
// Token validation on every request
app.addHook('preHandler', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }

  const token = authHeader.substring(7);
  try {
    request.user = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('TOKEN_EXPIRED', 'Access token expired');
    }
    throw new UnauthorizedError();
  }
});
```

### 9.2 Authorization

#### Row Level Security (RLS)
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

#### Resource Ownership Check
```typescript
// Middleware for resource ownership
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

### 9.3 Input Validation

```typescript
// Zod validation on every endpoint
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

// Validation middleware
app.post('/users', {
  schema: {
    body: createUserSchema
  },
  preHandler: validateRequest
}, createUserHandler);
```

### 9.4 SQL Injection Protection

```typescript
// ✅ CORRECT - Use Prisma ORM
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// ❌ WRONG - Raw SQL with user input
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// ⚠️ CAREFUL - If raw SQL is needed, use parameterized query
const user = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM users WHERE email = ${email}`
);
```

### 9.5 Sensitive Data Handling

```typescript
// Logging - redact sensitive data
logger.info('User login', {
  userId: user.id,
  email: '[REDACTED]',      // Redact email
  password: undefined,       // NEVER log password
  ip: request.ip,
  userAgent: request.headers['user-agent']
});

// Response - don't return password hash
const userResponse = {
  id: user.id,
  email: user.email,
  name: user.name,
  // passwordHash: user.passwordHash  ❌ NEVER
};

// Utility function
function excludeSensitive<T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[]
): Omit<T, (typeof keys)[number]> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

const safeUser = excludeSensitive(user, ['passwordHash', 'refreshToken']);
```

### 9.6 Rate Limiting

```typescript
import rateLimit from '@fastify/rate-limit';

// Global rate limit
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute'
});

// Endpoint-specific rate limits
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

### 9.7 CORS Configuration

```typescript
await app.register(cors, {
  origin: [
    'https://app.iwent.com.tr',
    'https://org.iwent.com.tr',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000'
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400 // 24 hours
});
```

### 9.8 Security Headers

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

---

## 10. Debugging & Troubleshooting

### 10.1 Log Levels

```typescript
// pino logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  redact: ['password', 'token', 'authorization', 'cookie', 'refreshToken']
});

// Usage
logger.fatal('Application crash', { error });     // 60 - Fatal
logger.error('Critical error', { error, stack }); // 50 - Critical errors
logger.warn('Warning', { context });              // 40 - Warnings
logger.info('Info', { action, userId });          // 30 - Information
logger.debug('Debug', { data });                  // 20 - Development
logger.trace('Trace', { detail });                // 10 - Detailed tracing
```

### 10.2 Request Logging

```typescript
// Request/Response logging
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
    error: error.message,
    stack: error.stack
  }, 'Request error');
});
```

### 10.3 Common Errors

| Error | Possible Cause | Solution |
|-------|----------------|----------|
| `PrismaClientKnownRequestError` P2002 | Unique constraint violation | Add duplicate check or use upsert |
| `PrismaClientKnownRequestError` P2025 | Record not found | Add findUnique null check |
| `TokenExpiredError` | JWT expired | Check refresh token flow |
| `RateLimitExceeded` | Too many requests | Increase rate limit config or add cache |
| `ConnectionPoolExhausted` | Too many DB connections | Add PgBouncer, increase connection pool size |
| `ECONNREFUSED` | Database/service down | Add health check, retry logic |

### 10.4 Database Debugging

```bash
# View DB with Prisma Studio
npx prisma studio

# Query logging
DEBUG="prisma:query" pnpm dev

# Slow query logging
DEBUG="prisma:query,prisma:info" pnpm dev

# Migration status
npx prisma migrate status

# Schema validation
npx prisma validate
```

### 10.5 Memory Leak Detection

```typescript
// Memory usage logging
setInterval(() => {
  const usage = process.memoryUsage();
  logger.debug({
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB',
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB'
  }, 'Memory usage');
}, 60000); // Every minute
```

### 10.6 Debugging Tips

1. **Use logger, not console**: `logger.debug` instead of `console.log`
2. **Add request ID**: Unique ID to each request for log correlation
3. **Save stack trace**: Always log stack trace on errors
4. **Redact sensitive data**: Don't log password, token, PII
5. **Structured logging**: Log as objects, not string concatenation

---

## 11. Deployment & DevOps

### 11.1 Environments

| Environment | URL | Branch | Auto Deploy |
|-------------|-----|--------|-------------|
| **Development** | localhost:3000 | - | - |
| **Staging** | staging.api.iwent.com.tr | develop | ✅ |
| **Production** | api.iwent.com.tr | main | ❌ Manual |

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: iwent_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm prisma generate
      - run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/iwent_test
      - run: pnpm test:coverage
      - run: pnpm lint

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Supabase (staging)
        run: |
          npx supabase link --project-ref ${{ secrets.STAGING_PROJECT_REF }}
          npx supabase db push
          npx supabase functions deploy

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # Manual approval required
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Supabase (production)
        run: |
          npx supabase link --project-ref ${{ secrets.PROD_PROJECT_REF }}
          npx supabase db push
          npx supabase functions deploy
```

### 11.3 Deployment Checklist

Before production deployment:
- [ ] All tests passing
- [ ] Tested on staging
- [ ] Database migration ready and tested
- [ ] Rollback plan documented
- [ ] Frontend informed if there's a breaking change
- [ ] Monitoring alerts configured
- [ ] Team notified on Slack
- [ ] Deployment window appropriate (off-peak hours)

### 11.4 Database Migration Workflow

```bash
# 1. Create migration locally
npx prisma migrate dev --name add_user_stories

# 2. Review migration
cat prisma/migrations/*/migration.sql

# 3. Deploy to staging
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# 4. Test on staging
# ... manual testing ...

# 5. Deploy to production (after approval)
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy
```

### 11.5 Rollback Procedure

```bash
# 1. Problem detection
# - Check monitoring alerts
# - Examine error logs
# - Check user reports

# 2. Quick rollback (revert last deployment)
git revert HEAD
git push origin main

# 3. Database rollback (if needed)
# ⚠️ CAUTION: Data loss may occur!
npx prisma migrate resolve --rolled-back <migration_name>

# 4. Post-mortem
# - Root cause analysis
# - Preventive measures
# - Documentation update
```

### 11.6 Environment Variables

```bash
# .env.example (committed)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
IYZICO_API_KEY="..."
IYZICO_SECRET_KEY="..."
GEMINI_API_KEY="..."
SENDGRID_API_KEY="..."
FIREBASE_PROJECT_ID="..."
SENTRY_DSN="..."
REDIS_URL="redis://..."

# NEVER COMMIT:
# - .env (production values)
# - Values containing *_SECRET
# - Production values containing *_KEY
```

---

## 12. Performance & Optimization

### 12.1 Query Optimization Rules

#### Avoid N+1 Problem
```typescript
// ❌ WRONG - N+1 query
const events = await prisma.event.findMany();
for (const event of events) {
  event.venue = await prisma.venue.findUnique({
    where: { id: event.venueId }
  });
}

// ✅ CORRECT - Use include
const events = await prisma.event.findMany({
  include: {
    venue: true,
    artists: true,
    ticketTypes: true
  }
});
```

#### Select Only What You Need
```typescript
// ❌ WRONG - Fetch all columns
const users = await prisma.user.findMany();

// ✅ CORRECT - Fetch only needed columns
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    avatarUrl: true
  }
});
```

#### Always Use Pagination
```typescript
// ✅ CORRECT - Cursor-based pagination (more performant)
const events = await prisma.event.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastEventId },
  orderBy: { startDate: 'asc' }
});

// ✅ CORRECT - Offset pagination (for simple cases)
const events = await prisma.event.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { startDate: 'asc' }
});
```

### 12.2 Caching Strategy

```typescript
// 3-Layer Cache

// Layer 1: CDN (CloudFlare)
const cdnCacheConfig = {
  staticAssets: '1 year',     // CSS, JS, images
  apiPublic: '5 minutes',     // Public API responses
  apiAuth: 'no-cache'         // Authenticated responses
};

// Layer 2: Redis
const redisCacheConfig = {
  'session:{userId}': '7d',           // User sessions
  'event:list:{city}:{page}': '5m',   // Event listings
  'event:detail:{id}': '10m',         // Event details
  'search:{hash}': '10m',             // Search results
  'analytics:{eventId}': '15m',       // Analytics data
  'config:public': '1h'               // Public config
};

// Layer 3: Application Memory
const memoryCacheConfig = {
  categories: '1h',           // Category list
  cities: '1h',               // City list
  config: '1h'                // Application config
};

// Redis cache implementation
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

### 12.3 Performance Targets

| Endpoint Category | P50 | P95 | P99 |
|-------------------|-----|-----|-----|
| Auth operations | <100ms | <200ms | <500ms |
| Simple GET (cached) | <30ms | <80ms | <150ms |
| Simple GET (db) | <50ms | <150ms | <300ms |
| Complex GET (joins) | <150ms | <400ms | <800ms |
| Search (full-text) | <100ms | <300ms | <600ms |
| NLP search | <500ms | <1.5s | <3s |
| POST/PUT/DELETE | <150ms | <350ms | <700ms |
| File upload (presign) | <50ms | <100ms | <200ms |
| Payment operations | <800ms | <2s | <5s |

### 12.4 Database Indexing Guidelines

```sql
-- Indexes for frequently used query patterns
CREATE INDEX idx_events_city_date ON events(city, start_date)
  WHERE status = 'published';

CREATE INDEX idx_events_organizer ON events(organizer_id)
  WHERE status = 'published';

CREATE INDEX idx_tickets_user_status ON tickets(user_id, status);

CREATE INDEX idx_messages_chat_created ON messages(chat_room_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_friendships_users ON friendships(requester_id, addressee_id)
  WHERE status = 'accepted';

-- Full-text search (Turkish)
CREATE INDEX idx_events_search ON events
  USING GIN(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));

-- Partial indexes (frequently filtered)
CREATE INDEX idx_events_upcoming ON events(start_date)
  WHERE status = 'published' AND start_date > NOW();
```

### 12.5 Connection Pool Configuration

```typescript
// Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
});

// Supabase connection limits
// Free tier: 60 connections
// Pro tier: 200 connections
// Recommendation: Use PgBouncer for production

// Connection string with pooling
// DATABASE_URL="postgresql://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## 13. Monitoring & Alerting

### 13.1 Health Checks

```typescript
// /health endpoint
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

// /ready endpoint (K8s readiness probe)
app.get('/ready', async () => {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis()
  ]);

  const allReady = checks.every(c => c.status === 'ok');
  if (!allReady) {
    throw new ServiceUnavailableError('Service not ready');
  }
  return { status: 'ready' };
});

// Individual health check
async function checkDatabase(): Promise<HealthCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```

### 13.2 Key Metrics

```typescript
// Prometheus metrics
const metrics = {
  // HTTP Metrics
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

  // Database Metrics
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

  // Business Metrics
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

### 13.3 Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | error_rate > 1% (5 min) | Critical | PagerDuty + Slack |
| High Latency | P95 > 2s (5 min) | Warning | Slack |
| Database Connection Pool | pool_usage > 80% | Warning | Slack |
| Memory Usage | memory > 85% | Warning | Slack |
| Disk Usage | disk > 80% | Warning | Slack |
| Payment Failures | failure_rate > 5% (15 min) | Critical | PagerDuty |
| Zero Ticket Sales | sales = 0 (1 hour, biz hours) | Warning | Slack |
| WebSocket Disconnects | disconnect_rate > 10% (5 min) | Warning | Slack |
| API Down | health_check_fail (1 min) | Critical | PagerDuty |

### 13.4 Error Tracking (Sentry)

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
    // PII redaction
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  }
});

// Error context
app.addHook('onRequest', (request, reply, done) => {
  Sentry.setUser({
    id: request.user?.id,
    role: request.user?.role
  });
  done();
});

// Error capture
app.setErrorHandler((error, request, reply) => {
  Sentry.captureException(error, {
    tags: {
      module: extractModule(request.url),
      method: request.method
    },
    extra: {
      requestId: request.id,
      body: request.body
    }
  });

  // Continue with normal error handling
  // ...
});
```

---

## 14. Workflow Examples

### 14.1 Adding New Endpoint

**Request**: "Add POST endpoint for user stories"

**Expected Workflow**:

```
1. 📖 READ FILES
   - iwent_openapi_v2.yaml (current API structure)
   - openapi_v3_additions.yaml (stories endpoint definition)
   - iwent_database_schema_v2.sql (user_stories table)
   - profile.txt (frontend requirement)

2. 📋 CREATE PLAN
   [Create todo list]
   - [ ] Update Prisma schema
   - [ ] Write repository layer
   - [ ] Write service layer
   - [ ] Write Controller/Route handler
   - [ ] Write validation schema
   - [ ] Write unit tests
   - [ ] Write integration tests

3. ⚠️ REQUEST APPROVAL (Level 2)
   "I will create Stories POST endpoint:
   - Route: POST /users/me/stories
   - Validation: mediaUrl, mediaType required
   - Auth: JWT required
   - Affected files: [list]
   Should I proceed?"

4. ✅ IMPLEMENT AND REPORT PROGRESS
   ✅ Prisma schema updated
   📍 Currently: Repository layer
   ⏳ Remaining: 5 steps

5. 🧪 WRITE AND RUN TESTS
   - Unit test: StoriesService.createStory
   - Integration test: POST /users/me/stories
```

---

### 14.2 Database Migration

**Request**: "Add gift columns to Tickets table"

**Expected Workflow**:

```
1. 📖 READ FILES
   - iwent_database_schema_v2.sql
   - Current tickets table structure
   - iWent_Backend_PRD.md (gift feature requirements)

2. 🔴 REQUEST APPROVAL (Level 3 - CRITICAL)
   "I will do a database migration:

   Columns to add:
   - gifted_by UUID (nullable, FK → users)
   - gifted_to UUID (nullable, FK → users)
   - gifted_at TIMESTAMPTZ (nullable)
   - gift_message TEXT (nullable)

   Migration SQL:
   ```sql
   ALTER TABLE tickets ADD COLUMN gifted_by UUID REFERENCES users(id);
   ALTER TABLE tickets ADD COLUMN gifted_to UUID REFERENCES users(id);
   ALTER TABLE tickets ADD COLUMN gifted_at TIMESTAMPTZ;
   ALTER TABLE tickets ADD COLUMN gift_message TEXT;
   ```

   Rollback SQL:
   ```sql
   ALTER TABLE tickets DROP COLUMN gifted_by;
   ALTER TABLE tickets DROP COLUMN gifted_to;
   ALTER TABLE tickets DROP COLUMN gifted_at;
   ALTER TABLE tickets DROP COLUMN gift_message;
   ```

   Do you approve this migration?"

3. ✅ IMPLEMENT AFTER APPROVAL
   - Create migration
   - Update Prisma schema
   - Test
   - Update schema files
```

---

### 14.3 Bug Fix

**Request**: "There's a race condition in ticket sales, fix it"

**Expected Workflow**:

```
1. 📖 EXAMINE CURRENT IMPLEMENTATION
   - orders.service.ts
   - tickets.repository.ts
   - Related tests

2. 🔍 ROOT CAUSE ANALYSIS
   "I detected a race condition:

   Problem:
   - Same ticket can be sold in concurrent requests
   - 2 users buying the last ticket at the same time

   Cause:
   - Gap between SELECT (stock check) and UPDATE (stock decrement)
   - Transaction isolation level insufficient

   Solution:
   - SELECT with FOR UPDATE lock
   - SERIALIZABLE isolation level
   - Optimistic locking (version column)"

3. 📋 SOLUTION PLAN
   - [ ] Write failing test (simulate race condition)
   - [ ] Update transaction isolation
   - [ ] Add FOR UPDATE lock
   - [ ] Verify fix passes test
   - [ ] Add integration test

4. ⚠️ REQUEST APPROVAL (Level 2)
   "I will apply race condition fix:

   Changes:
   - Transaction isolation: SERIALIZABLE in purchaseTicket method
   - FOR UPDATE lock in findAvailableTickets query

   Potential impacts:
   - Lock wait on concurrent requests (max 30s timeout)
   - Database load increase (minimal)

   Should I proceed?"

5. ✅ IMPLEMENT AND TEST
   - Apply fix
   - Pass unit test
   - Pass integration test
   - Load test (100 concurrent requests)
```

---

### 14.4 New Feature (Large)

**Request**: "Implement user stories feature"

**Expected Workflow**:

```
1. 📖 COMPREHENSIVE ANALYSIS
   - profile.txt (frontend requirements)
   - iwent_database_schema_v2.sql (user_stories table)
   - openapi_v3_additions.yaml (endpoints)
   - iWent_Backend_PRD.md (stories section)

2. 📋 DETAILED PLAN
   [Todo list - ~15 steps]

   Database:
   - [ ] Check user_stories table
   - [ ] Check story_tags table
   - [ ] Check story_views table
   - [ ] Update Prisma schema

   Backend:
   - [ ] StoriesRepository
   - [ ] StoriesService
   - [ ] StoriesController (5 endpoints)
   - [ ] Validation schemas
   - [ ] Supabase Storage integration

   Tests:
   - [ ] Unit tests (service layer)
   - [ ] Integration tests (API layer)

   Cron:
   - [ ] Story cleanup Edge Function

3. 🔴 REQUEST APPROVAL (Level 3 - Large Feature)
   "I will implement User Stories feature:

   Scope:
   - 3 database tables
   - 5 API endpoints
   - Supabase Storage integration
   - Hourly cron job

   Affected areas:
   - Database: 3 new tables ✅ (already exist)
   - API: 5 new endpoints
   - Storage: stories bucket
   - Cron: Edge Function

   Estimated steps: 15

   Should I proceed with this plan?"

4. 🔄 INTERMEDIATE APPROVALS
   Every 3-4 steps:
   "📊 INTERIM STATUS REPORT

   Completed: [4/15]
   - Database schema ✅
   - Repository layer ✅
   - Service layer ✅
   - Controller ✅

   In progress: Validation schemas

   No issues, should I continue?"

5. 🧪 COMPREHENSIVE TESTING
   - Unit test coverage: >80%
   - Integration tests: all endpoints
   - Edge case tests: expiry, tagging, visibility
```

---

## Summary: Critical Rules

### ✅ YOU MUST DO

1. **Before starting any work** read related files
2. **Use TodoWrite** (for 2+ steps)
3. **Get approval** (Level 2-3 changes)
4. **Report progress** (after each major step)
5. **Write tests** (before code is complete)
6. **Ask when uncertain** (don't assume)

### ❌ YOU MUST NOT DO

1. Suggest changing technical stack
2. Make critical changes without approval
3. Skip tests
4. Scope creep
5. Over-engineering
6. Code with security vulnerabilities

### 📊 APPROVAL LEVELS

| Level | Operation Type | Approval |
|-------|----------------|----------|
| 1 | Typo, comment, formatting | Inform |
| 2 | New endpoint, logic change | Request approval |
| 3 | DB migration, security, breaking change | Detailed approval |

---

**CLAUDE.md Version:** 1.0
**Last Updated:** January 2026
**Maintainer:** iWent Backend Team
