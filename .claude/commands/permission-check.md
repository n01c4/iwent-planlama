# Permission Check Command

Endpoint authorization doğrulama.

## Input
`$ARGUMENTS` - Endpoint path veya modül adı (örn: `/org/events` veya `organizer`)

## Workflow

### 1. PRD Permission Matrix Okuma
`iWent_Backend_PRD.md` Section 2.2'deki permission matrix'i referans al:

| Resource | Public | User | Organizer | Admin |
|----------|--------|------|-----------|-------|
| Events (list) | ✓ | ✓ | ✓ | ✓ |
| Events (create) | ✗ | ✗ | ✓ | ✓ |
| Orders (create) | ✗ | ✓ | ✓ | ✓ |
| ... | ... | ... | ... | ... |

### 2. Endpoint Analizi
Belirtilen endpoint için beklenen permission'ı belirle:
- Hangi HTTP method?
- Hangi resource?
- Ownership gerekli mi?

### 3. Implementation Kontrolü

#### Middleware Kontrolü
```typescript
// Beklenen middleware chain
fastify.METHOD('/path', {
  preHandler: [
    requireAuth,           // Auth zorunlu mu?
    requireRole('role'),   // Role kontrolü var mı?
    requireOwnership()     // Ownership kontrolü var mı?
  ],
  handler
});
```

#### Kontrol Noktaları
- [ ] `requireAuth` middleware kullanılmış mı?
- [ ] `requireRole()` doğru role'ü kontrol ediyor mu?
- [ ] Ownership check gerekli mi ve yapılıyor mu?
- [ ] Public endpoint'te gereksiz auth var mı?

### 4. RLS Policy Uyumu
`iwent_database_schema_v2.sql` dosyasındaki ilgili RLS policy'yi kontrol et:

```sql
-- Örnek: orders tablosu için
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid() = user_id);
```

Backend middleware ile RLS policy uyumlu mu?

### 5. Special Rules Kontrolü

#### Profile Visibility Rule
PRD Section 2.6'daki özel kural:
> Kullanıcılar sadece ortak etkinliğe katıldıkları kullanıcıların profillerini görebilir.

Bu kural için SQL:
```sql
SELECT EXISTS (
  SELECT 1
  FROM tickets t1
  JOIN tickets t2 ON t1.event_id = t2.event_id
  WHERE t1.user_id = :current_user
  AND t2.user_id = :target_user
  AND t1.status = 'CONFIRMED'
  AND t2.status = 'CONFIRMED'
);
```

#### Friends-Only Features
- Personal chat: Sadece arkadaşlar
- Stories view: Sadece arkadaşlar

## Output Format

```
## Permission Check Report: [ENDPOINT]

### Expected Permissions (PRD)
- Auth Required: Yes/No
- Allowed Roles: [roles]
- Ownership Check: Yes/No

### Actual Implementation
- Auth Middleware: ✓/✗
- Role Check: ✓/✗ (found: [roles])
- Ownership Check: ✓/✗

### RLS Policy
- Table: [table_name]
- Policy: [policy_name]
- Match: ✓/✗

### Issues Found
1. [Issue description]

### Recommendations
1. [Fix recommendation]
```

## Referans
- `iWent_Backend_PRD.md` - Section 2.2 Permission Matrix
- `iWent_Backend_PRD.md` - Section 2.6 Special Rules
- `iwent_database_schema_v2.sql` - RLS Policies (line 1429+)
