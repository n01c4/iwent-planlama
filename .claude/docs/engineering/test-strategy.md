# Test Strategy

## Test Pyramid
```
          /\
         /  \    E2E tests (few, critical flows)
        /----\   Integration tests (API layer)
       /      \  Unit tests (business logic)
      /--------\ Benchmarks/load as needed
```

## Tools
| Tool | Use Case |
|------|----------|
| Vitest | Unit tests, fast runner. |
| Supertest | HTTP integration tests. |
| @prisma/client/mock | Database mocks. |
| MSW | External API mocks. |
| Faker.js | Test data generation. |

## Writing Tests
- Aim for clear Arrange/Act/Assert structure.
- Cover happy path and edge cases.

### Unit Test Example
```typescript
describe('TicketService.calculatePrice', () => {
  it('applies early bird discount within range', () => {
    const rule: PricingRule = {
      type: 'early_bird',
      discountPercent: 20,
      validUntil: new Date('2026-02-01')
    };
    const price = calculatePrice(100, rule, new Date('2026-01-15'));
    expect(price).toBe(80);
  });

  it('skips discount after validity date', () => {
    const rule: PricingRule = {
      type: 'early_bird',
      discountPercent: 20,
      validUntil: new Date('2026-01-10')
    };
    const price = calculatePrice(100, rule, new Date('2026-01-15'));
    expect(price).toBe(100);
  });
});
```

### Integration Test Example
```typescript
describe('POST /api/v1/orders', () => {
  let app: FastifyInstance;
  let testUser: User;
  let testEvent: Event;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    testUser = await createTestUser();
    testEvent = await createTestEvent();
    token = generateTestToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  it('creates order with valid ticket', async () => {
    const response = await request(app.server)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: testEvent.id,
        items: [{ ticketTypeId: testEvent.ticketTypes[0].id, quantity: 2 }]
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('pending');
    expect(response.body.items).toHaveLength(1);
  });

  it('rejects unauthenticated request', async () => {
    const response = await request(app.server)
      .post('/api/v1/orders')
      .send({ eventId: testEvent.id, items: [] });
    expect(response.status).toBe(401);
  });
});
```

## Coverage Targets
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

## When to Write Tests
| Situation | Strategy |
|-----------|----------|
| New feature | TDD or alongside implementation. |
| Bug fix | First write a failing test, then fix. |
| Refactor | Update existing tests to match behavior. |
| Security fix | Add security-focused tests. |
| Performance fix | Add benchmarks or perf guards. |

## Commands
```
pnpm test                    # all tests
pnpm test:watch              # watch mode
pnpm test:coverage           # coverage report
pnpm test -- --filter=auth   # specific module
pnpm test -- src/.../file.ts # specific file
pnpm test:integration        # integration tests
pnpm test:e2e                # e2e tests
```

## Test Data Management
```typescript
// fixtures/users.ts
export const createTestUser = async (
  overrides?: Partial<User>
): Promise<User> => {
  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      passwordHash: await hash('TestPassword123!'),
      ...overrides
    }
  });
};

afterEach(async () => {
  await prisma.order.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});
```
