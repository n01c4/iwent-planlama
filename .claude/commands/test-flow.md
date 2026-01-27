# Test Flow Command

E2E user flow test senaryosu oluşturma.

## Input
`$ARGUMENTS` - Flow adı (örn: `ticket-purchase`, `friend-request`, `event-publish`, `checkin`)

## Predefined Flows

### ticket-purchase
Kullanıcı bilet satın alma akışı:
1. Event listele/ara
2. Event detay görüntüle
3. Ticket type seç
4. Order oluştur
5. Payment intent al
6. Ödeme yap
7. Order confirm
8. Ticket'ları görüntüle

### friend-request
Arkadaşlık akışı:
1. Kullanıcı ara
2. Profil görüntüle
3. Arkadaşlık isteği gönder
4. (Diğer kullanıcı) İstekleri listele
5. İsteği kabul et
6. Arkadaş listesinde görüntüle
7. Chat başlat

### event-publish
Organizatör event publish akışı:
1. Event draft oluştur
2. Venue ekle/seç
3. Artist ekle
4. Media upload
5. Ticket type'lar oluştur
6. Discount code ekle (opsiyonel)
7. Event publish
8. Event'i public olarak kontrol et

### checkin
Etkinlik check-in akışı:
1. Organizatör login
2. Event seç
3. Attendee listesi al
4. QR code/ticket ID ile check-in
5. Check-in durumunu doğrula
6. Stats güncellendi mi kontrol et

### story-flow
Story oluşturma ve görüntüleme:
1. Story oluştur (media upload)
2. Arkadaş etiketle
3. Story listele (kendi)
4. (Arkadaş olarak) Story görüntüle
5. View kaydedildi mi kontrol et
6. 24 saat sonra silinme (simüle)

## Workflow

### 1. Flow Adımlarını Tanımlama
Her adım için:
- API endpoint
- HTTP method
- Request body/params
- Expected response
- Assertions

### 2. Test Data Hazırlama

```typescript
const testData = {
  users: {
    buyer: {
      email: 'buyer@test.com',
      password: 'Test123!',
      name: 'Test Buyer'
    },
    organizer: {
      email: 'org@test.com',
      password: 'Test123!',
      role: 'organizer'
    }
  },
  event: {
    title: 'Test Concert',
    startDate: '2026-03-01T20:00:00Z',
    // ...
  },
  ticketType: {
    name: 'General Admission',
    price: 100,
    capacity: 500
  }
};
```

### 3. API Call Sequence

```typescript
describe('Ticket Purchase Flow', () => {
  let accessToken: string;
  let eventId: string;
  let orderId: string;

  beforeAll(async () => {
    // Setup: Create test data
  });

  afterAll(async () => {
    // Cleanup: Remove test data
  });

  it('Step 1: User login', async () => {
    const response = await api.post('/auth/login', {
      email: testData.users.buyer.email,
      password: testData.users.buyer.password
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    accessToken = response.body.accessToken;
  });

  it('Step 2: List events', async () => {
    const response = await api
      .get('/events')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    eventId = response.body[0].id;
  });

  it('Step 3: Get event details', async () => {
    const response = await api
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(eventId);
  });

  // ... continue with remaining steps
});
```

### 4. Assertion Points

Her adımda kontrol edilecekler:
- HTTP status code
- Response body structure
- Data consistency (önceki adımlarla)
- Side effects (DB changes, notifications)

### 5. Edge Cases

Her flow için edge case'ler:
- Network error
- Invalid token mid-flow
- Concurrent operations
- Race conditions
- Timeout scenarios

### 6. Cleanup Logic

```typescript
afterAll(async () => {
  // Reverse order cleanup
  await prisma.ticket.deleteMany({ where: { eventId } });
  await prisma.order.deleteMany({ where: { eventId } });
  await prisma.ticketType.deleteMany({ where: { eventId } });
  await prisma.event.delete({ where: { id: eventId } });
  await prisma.user.delete({ where: { email: testData.users.buyer.email } });
});
```

## Output Format

### E2E Test File
```
tests/e2e/[flow-name].e2e.test.ts
```

### Postman Collection (Alternative)
```json
{
  "info": {
    "name": "Ticket Purchase Flow",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Step 1: Login",
      "request": { /* ... */ },
      "event": [
        {
          "script": { /* post-request assertions */ }
        }
      ]
    }
  ]
}
```

## Flow Diagram Template

```
[Start]
    │
    ▼
┌─────────────────┐
│  Step 1: Login  │
└────────┬────────┘
         │ accessToken
         ▼
┌─────────────────┐
│ Step 2: Action  │──── Error ──→ [Handle Error]
└────────┬────────┘
         │
         ▼
       [End]
```

## Referans
- `iwent_openapi_v2.yaml` - Endpoint definitions
- `iWent_Backend_PRD.md` - Business flows
- `iwent_database_schema_v2.sql` - Data relationships
