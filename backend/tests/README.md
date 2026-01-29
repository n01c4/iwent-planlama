# iWent Backend E2E Test Suite

Comprehensive End-to-End testing suite for the iWent Backend API using Jest and Supertest.

## 📋 Test Coverage

### Implemented Test Suites

1. **Auth Module** (`01_auth.test.ts`)
   - User Registration
   - Login/Logout
   - Token Refresh & Rotation
   - Logout All Devices
   - Protected Routes
   - Password Security

2. **Users Module** (`02_users.test.ts`)
   - Get Current User Profile
   - Update Profile
   - Change Password
   - Get Public User Profile
   - User Tickets & Orders
   - Account Deletion (Soft Delete)

3. **Organizers Module** (`03_organizers.test.ts`)
   - Create Organizer Profile
   - Get/Update Organizer Profile
   - Organizer Events List
   - Create/Publish Events
   - Organizer Stats
   - Public Organizer Profile

4. **Events Module** (`04_events.test.ts`)
   - Public Event Listing
   - Event Details (by ID and Slug)
   - Search & Filtering
   - Categories
   - Event CRUD Operations
   - Ticket Types Management
   - View Count Tracking

5. **Social Features** (`05_social.test.ts`)
   - Friend Requests (Send/Accept/Reject)
   - Friends List
   - Block/Unblock Users
   - Event Likes/Unlikes
   - Artist Following

## 🚀 Quick Start

### Prerequisites

1. **Node.js 20+** installed
2. **PostgreSQL** running locally or in Docker
3. **Test Database** created

### Setup

#### Option 1: Local PostgreSQL

```bash
# Create test database
createdb iwent_test

# Update .env.test with your credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/iwent_test"
```

#### Option 2: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name iwent-test-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=iwent_test \
  -p 5432:5432 \
  -d postgres:16

# Use in .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/iwent_test"
```

### Configuration

1. **Copy test environment file:**
   ```bash
   cp .env.test.example .env.test
   ```
   (Already created at `backend/.env.test`)

2. **Update database credentials** in `.env.test`

3. **Push Prisma schema to test database:**
   ```bash
   NODE_ENV=test npx prisma db push
   ```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/01_auth.test.ts

# Run with watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run with verbose output
npm run test:e2e -- --verbose
```

## 🏗️ Test Architecture

### Directory Structure

```
backend/
├── tests/
│   ├── e2e/
│   │   ├── helpers/
│   │   │   ├── db-utils.ts       # Database setup/teardown
│   │   │   ├── auth-utils.ts     # Auth helpers
│   │   │   ├── global-setup.ts   # Runs before all tests
│   │   │   ├── global-teardown.ts
│   │   │   └── setup.ts          # Runs before each test file
│   │   ├── 01_auth.test.ts
│   │   ├── 02_users.test.ts
│   │   ├── 03_organizers.test.ts
│   │   ├── 04_events.test.ts
│   │   └── 05_social.test.ts
│   └── README.md (this file)
├── jest.config.ts
└── .env.test
```

### Test Lifecycle

```
┌─────────────────────────────────────┐
│  1. Global Setup                    │
│     - Load .env.test                │
│     - Connect to DB                 │
│     - Clean all tables              │
│     - Seed minimal data             │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  2. Test Execution (Sequential)     │
│     - Initialize Fastify app        │
│     - Run test suites               │
│     - Verify DB state               │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  3. Global Teardown                 │
│     - Disconnect from DB            │
│     - Cleanup resources             │
└─────────────────────────────────────┘
```

## 🛠️ Helper Functions

### Database Utilities (`db-utils.ts`)

```typescript
import { getPrisma, createTestUser, createTestEvent, cleanDb } from './helpers/db-utils.js';

// Get Prisma client
const prisma = getPrisma();

// Create test user
const testUser = await createTestUser({
  email: 'test@example.com',
  password: 'Pass123!',
  role: 'user',
  createOrganizer: true, // Optional
});

// Create test event
const event = await createTestEvent(organizerId, {
  title: 'Test Event',
  startDate: new Date(),
  status: 'published',
});

// Clean database (called automatically in global setup)
await cleanDb();
```

### Auth Utilities (`auth-utils.ts`)

```typescript
import { authRequest, loginUser, getOrganizerToken } from './helpers/auth-utils.js';

// Login user
const tokens = await loginUser(app, {
  email: 'user@example.com',
  password: 'Pass123!',
});

// Get organizer token (creates organizer if needed)
const { token, userId } = await getOrganizerToken(app);

// Make authenticated requests
const response = await authRequest(app, token)
  .get('/api/v1/users/me')
  .expect(200);
```

## ✅ Test Best Practices

### 1. Isolation
Each test should be independent and not rely on others.

```typescript
// ✅ Good - Independent test
it('should create user', async () => {
  const user = await createTestUser({ email: `user-${Date.now()}@test.com` });
  expect(user).toBeDefined();
});

// ❌ Bad - Depends on previous test
let sharedUserId;
it('creates user', async () => {
  sharedUserId = ...;
});
it('updates user', async () => {
  // Uses sharedUserId from previous test
});
```

### 2. Database Verification
Always verify database state, not just HTTP responses.

```typescript
// ✅ Good - Verifies DB
const response = await authRequest(app, token)
  .post('/api/v1/org/events')
  .send(eventData)
  .expect(201);

const prisma = getPrisma();
const event = await prisma.event.findUnique({
  where: { id: response.body.data.id },
});
expect(event?.title).toBe(eventData.title);

// ❌ Bad - Only checks HTTP response
const response = await authRequest(app, token)
  .post('/api/v1/org/events')
  .send(eventData)
  .expect(201);
// Missing DB verification!
```

### 3. Unique Test Data
Use timestamps to ensure unique data.

```typescript
// ✅ Good
const email = `test-${Date.now()}@iwent.test`;

// ❌ Bad - Can cause conflicts
const email = 'test@iwent.test';
```

### 4. Meaningful Assertions
Use specific matchers instead of generic ones.

```typescript
// ✅ Good
expect(response.body.data).toMatchObject({
  id: expect.any(String),
  email: expectedEmail,
  role: 'user',
});

// ❌ Bad
expect(response.body.data).toBeDefined();
```

## 🔒 Security Notes

### ⚠️ CRITICAL: Never Run Tests on Production

The test suite includes safety checks:

```typescript
// In global-setup.ts
if (dbUrl.includes('prod') || dbUrl.includes('production')) {
  throw new Error('SAFETY: Refusing to run tests on production!');
}
```

### Database Cleanup

Tests use `TRUNCATE CASCADE` to clean all tables. This is **destructive** and should only run on test databases.

## 📊 Coverage Goals

| Module | Target Coverage | Current Status |
|--------|----------------|----------------|
| Auth | 90%+ | ✅ Comprehensive |
| Users | 85%+ | ✅ Comprehensive |
| Organizers | 85%+ | ✅ Comprehensive |
| Events | 80%+ | ✅ Comprehensive |
| Social | 75%+ | ✅ Comprehensive |
| Orders | 80%+ | ⏳ TODO (Faz 4) |
| Payments | 80%+ | ⏳ TODO (Faz 4) |
| Analytics | 70%+ | ⏳ TODO (Faz 6) |
| Chat | 70%+ | ⏳ TODO (Faz 5) |

## 🐛 Troubleshooting

### Tests Failing to Connect to DB

```bash
# Check if PostgreSQL is running
pg_isready

# Check if test database exists
psql -l | grep iwent_test

# Recreate test database
dropdb iwent_test && createdb iwent_test
NODE_ENV=test npx prisma db push
```

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma client
npx prisma generate

# Push schema changes
NODE_ENV=test npx prisma db push
```

### Test Timeout

Increase timeout in `jest.config.ts`:

```typescript
testTimeout: 60000, // 60 seconds
```

## 📝 Adding New Tests

### 1. Create Test File

```bash
touch tests/e2e/06_new-module.test.ts
```

### 2. Follow Naming Convention

- `01_`, `02_`, etc. for execution order
- Descriptive module name
- `.test.ts` extension

### 3. Test Template

```typescript
import request from 'supertest';
import { getApp, closeApp } from './helpers/setup.js';
import { getPrisma, createTestUser } from './helpers/db-utils.js';
import { authRequest, loginUser } from './helpers/auth-utils.js';
import type { FastifyInstance } from 'fastify';

describe('New Module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  describe('Feature Group', () => {
    it('should do something', async () => {
      // Arrange
      const testData = { /* ... */ };

      // Act
      const response = await request(app.server)
        .post('/api/v1/endpoint')
        .send(testData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({ /* ... */ });

      // Verify DB
      const prisma = getPrisma();
      const record = await prisma.model.findUnique({ /* ... */ });
      expect(record).toBeDefined();
    });
  });
});
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Fastify Testing](https://fastify.dev/docs/latest/Guides/Testing/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

## 🤝 Contributing

When adding tests:
1. Follow existing naming conventions
2. Add both positive and negative test cases
3. Verify database state
4. Update this README if adding new utilities
5. Run full test suite before committing

---

**Last Updated:** January 2026
**Test Suite Version:** 1.0.0
