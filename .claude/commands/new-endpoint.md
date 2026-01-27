# New Endpoint Command

Yeni bir API endpoint oluşturma workflow'u.

## Input
`$ARGUMENTS` - Endpoint path ve HTTP method (örn: `POST /venues/{id}/reviews`)

## Workflow

### 1. OpenAPI Spec Kontrolü
`iwent_openapi_v2.yaml` dosyasını oku ve belirtilen endpoint'in tanımlı olup olmadığını kontrol et:
- Tanımlıysa: Schema'yı referans al
- Tanımlı değilse: PRD'ye uygun şekilde OpenAPI spec'e endpoint tanımı ekle

### 2. Permission Belirleme
`iWent_Backend_PRD.md` dosyasındaki Section 2.2 Permission Matrix'e bak:
- Bu endpoint hangi role'ler için erişilebilir?
- Ownership check gerekli mi?
- Public erişim var mı?

### 3. Route Handler Oluşturma
Mevcut project structure'a uygun şekilde route handler oluştur:
```typescript
// Örnek structure
fastify.METHOD('/path', {
  preHandler: [/* middleware'ler */],
  schema: {/* validation schema */},
  handler: async (request, reply) => {
    // Implementation
  }
});
```

### 4. Validation Schema
Request için Zod veya JSON Schema validation:
- Path parameters
- Query parameters
- Request body
- Response schema

### 5. Service Layer
İlgili service dosyasına method ekle:
- Business logic
- Database operations (Prisma)
- Error handling

### 6. Repository Layer (Gerekirse)
Karmaşık query'ler için repository pattern kullan.

### 7. Test Scaffolding
Endpoint için test dosyası oluştur:
- Happy path
- Validation errors
- Auth errors
- Edge cases

## Checklist
Endpoint tamamlandığında kontrol et:
- [ ] OpenAPI spec'te tanımlı
- [ ] Doğru auth middleware kullanılmış
- [ ] Request validation var
- [ ] Response type tanımlı
- [ ] Error handling var
- [ ] Test dosyası oluşturulmuş
- [ ] Logging eklenmiş

## Referans Dosyalar
- `iwent_openapi_v2.yaml` - API specification
- `iWent_Backend_PRD.md` - Permission matrix (Section 2.2)
- `iwent_database_schema_v2.sql` - Database schema
