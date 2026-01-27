# Validate Endpoint Command

Mevcut endpoint'in kalite kontrolü.

## Input
`$ARGUMENTS` - Endpoint path (örn: `/tickets/{id}/gift`, `/venues/{id}/reviews`)

## Quality Checklist

### 1. Authentication & Authorization
- [ ] Auth middleware doğru kullanılmış mı?
- [ ] Public endpoint'te gereksiz auth yok mu?
- [ ] Role check gerekli mi ve var mı?
- [ ] Ownership check gerekli mi ve var mı?

```typescript
// Kontrol edilecek pattern
preHandler: [requireAuth, requireRole('organizer'), requireOwnership('event')]
```

### 2. Request Validation
- [ ] Path parameters validate ediliyor mu?
- [ ] Query parameters validate ediliyor mu?
- [ ] Request body validate ediliyor mu?
- [ ] Validation error'ları anlamlı mı?

```typescript
// Beklenen validation
schema: {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' }
    },
    required: ['id']
  },
  body: {
    // Zod veya JSON Schema
  }
}
```

### 3. Error Handling
- [ ] Try-catch kullanılmış mı?
- [ ] Custom error class'ları kullanılıyor mu?
- [ ] HTTP status code'ları doğru mu?
- [ ] Error response formatı consistent mi?

```typescript
// Beklenen error handling
try {
  // logic
} catch (error) {
  if (error instanceof NotFoundError) {
    return reply.status(404).send({ error: 'Not found' });
  }
  throw error; // Global error handler'a bırak
}
```

**HTTP Status Code Rehberi:**
| Code | Kullanım |
|------|----------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate, race condition) |
| 422 | Unprocessable Entity (business logic error) |
| 500 | Internal Server Error |

### 4. Response Format
- [ ] Response type tanımlı mı?
- [ ] Response formatı OpenAPI ile uyumlu mu?
- [ ] Pagination varsa consistent format kullanılmış mı?
- [ ] Gereksiz data expose edilmiyor mu?

```typescript
// Beklenen response format
{
  data: T | T[],
  meta?: {
    page: number,
    limit: number,
    total: number
  }
}
```

### 5. Logging
- [ ] Request logging var mı?
- [ ] Error logging var mı?
- [ ] Sensitive data loglanmıyor mu?
- [ ] Log level doğru mu?

```typescript
// Beklenen logging
request.log.info({ eventId }, 'Processing event');
request.log.error({ error, eventId }, 'Failed to process event');
```

### 6. Documentation
- [ ] OpenAPI spec'te tanımlı mı?
- [ ] Request/response schema doğru mu?
- [ ] Example'lar var mı?
- [ ] Error response'lar tanımlı mı?

### 7. Type Safety
- [ ] TypeScript types doğru mu?
- [ ] Generic type'lar kullanılmış mı?
- [ ] Any kullanılmamış mı?
- [ ] Prisma types doğru import edilmiş mi?

### 8. Performance
- [ ] N+1 query var mı?
- [ ] Gereksiz data fetch edilmiyor mu?
- [ ] Pagination kullanılmış mı?
- [ ] Index kullanılıyor mu?

## Output Format

```
# Endpoint Validation Report: [METHOD] [PATH]

## Summary
- Score: X/8 categories passed
- Status: PASS / NEEDS WORK / FAIL

## Checklist Results

### ✓ Passed
- [Category]: [Details]

### ⚠️ Warnings
- [Category]: [Issue] - [Recommendation]

### ✗ Failed
- [Category]: [Issue] - [Required Fix]

## Code Suggestions
[Specific code improvements]
```

## Referans
- `iwent_openapi_v2.yaml` - API specification
- `iWent_Backend_PRD.md` - Permission matrix
