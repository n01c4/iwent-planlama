# Code Style and Conventions

## File Naming
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

## Module Folder Structure
```
src/modules/tickets/
|- tickets.controller.ts
|- tickets.service.ts
|- tickets.repository.ts
|- tickets.schema.ts
|- tickets.types.ts
|- tickets.test.ts
|- tickets.constants.ts
|- index.ts             # Public exports
```

## Naming Patterns
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

## Error Handling Pattern
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

// Service usage
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

  logger.error({ error }, 'Unhandled error');
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

## API Response Format
```typescript
// Success response
interface SuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Error response
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

Example success payload:
```json
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
```

Example error payload:
```json
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

## Commit Convention
```
type(scope): description

Types:
- feat:     New feature
- fix:      Bug fix
- refactor: Code restructuring without behavior change
- docs:     Documentation
- test:     Adding or updating tests
- chore:    Build or config changes
- perf:     Performance improvement
- style:    Formatting or linting

Scopes (examples):
- auth, users, events, tickets, orders
- social, friends, stories, chat
- venues, artists
- org, analytics, moderation
- payments, notifications
- config, deps, ci

Examples:
feat(social): add user stories endpoints
fix(tickets): handle race condition in purchase flow
refactor(auth): extract token validation middleware
docs(api): update OpenAPI spec for v3 endpoints
test(orders): add integration tests for refund flow
chore(deps): update prisma to v5.8.0
```

## TypeScript Practices
```typescript
// Explicit return types
async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// Prefer unknown over any
function parseJson(data: unknown): Record<string, unknown> {
  if (typeof data !== 'string') {
    throw new Error('Expected string');
  }
  return JSON.parse(data);
}

// Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

// Const assertions
const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];
```
