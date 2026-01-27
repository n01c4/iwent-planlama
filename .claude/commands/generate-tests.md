# Generate Tests Command

Unit test dosyası scaffolding.

## Input
`$ARGUMENTS` - Service veya handler dosya path'i (örn: `src/services/ticket.service.ts`)

## Workflow

### 1. Target Dosya Analizi
Dosyayı oku ve analiz et:
- Class/module adı
- Public method'lar
- Dependencies (inject edilen servisler)
- Return types
- Thrown errors

### 2. Test Case Belirleme

Her public method için:

#### Happy Path
- Normal input ile beklenen output
- Tüm valid senaryolar

#### Edge Cases
- Empty input
- Null/undefined
- Boundary values (min/max)
- Special characters

#### Error Cases
- Invalid input
- Not found scenarios
- Permission denied
- Business rule violations

### 3. Mock Tanımlama

Dependency'ler için mock oluştur:
```typescript
// Prisma mock
const mockPrisma = {
  ticket: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }
};

// Service mock
const mockEmailService = {
  sendEmail: vi.fn(),
};
```

### 4. Test Dosyası Oluşturma

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketService } from './ticket.service';

describe('TicketService', () => {
  let service: TicketService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      ticket: {
        findUnique: vi.fn(),
        create: vi.fn(),
      }
    };
    service = new TicketService(mockPrisma);
  });

  describe('getTicketById', () => {
    it('should return ticket when found', async () => {
      // Arrange
      const mockTicket = { id: '123', status: 'CONFIRMED' };
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);

      // Act
      const result = await service.getTicketById('123');

      // Assert
      expect(result).toEqual(mockTicket);
      expect(mockPrisma.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: '123' }
      });
    });

    it('should throw NotFoundError when ticket not found', async () => {
      // Arrange
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTicketById('123'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

## Test Pattern Templates

### Service Method Test
```typescript
describe('[methodName]', () => {
  it('should [expected behavior] when [condition]', async () => {
    // Arrange
    const input = { /* test input */ };
    mockDependency.method.mockResolvedValue(/* mock return */);

    // Act
    const result = await service.methodName(input);

    // Assert
    expect(result).toEqual(/* expected */);
  });
});
```

### Handler/Controller Test
```typescript
describe('[METHOD] [PATH]', () => {
  it('should return [status] when [condition]', async () => {
    // Arrange
    const request = {
      params: { id: '123' },
      body: { /* body */ },
      user: { id: 'user-123', role: 'user' }
    };

    // Act
    const response = await handler(request, reply);

    // Assert
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(response).toMatchObject({ /* expected */ });
  });
});
```

### Validation Test
```typescript
describe('validation', () => {
  it('should reject invalid [field]', async () => {
    const invalidInput = { field: 'invalid' };

    await expect(service.method(invalidInput))
      .rejects
      .toThrow(ValidationError);
  });
});
```

## Common Test Scenarios

### CRUD Operations
- Create: valid data, duplicate, missing required fields
- Read: exists, not found, unauthorized
- Update: valid, not found, partial update, unauthorized
- Delete: exists, not found, unauthorized, cascade check

### Authentication
- Valid token
- Expired token
- Invalid token
- Missing token

### Authorization
- Correct role
- Insufficient role
- Ownership check pass
- Ownership check fail

### Pagination
- First page
- Middle page
- Last page
- Empty results
- Invalid page number

## Output
Test dosyası: `[original-file].test.ts`

## Naming Convention
- Test dosyası: `*.test.ts` veya `*.spec.ts`
- Describe: Class/module adı
- Nested describe: Method adı
- It: "should [behavior] when [condition]"

## Referans
- Vitest documentation
- Testing best practices
- Project existing tests (pattern'ları takip et)
