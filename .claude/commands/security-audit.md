# Security Audit Command

Kod güvenlik denetimi.

## Input
`$ARGUMENTS` - Modül veya dosya path'i (opsiyonel, boşsa tüm codebase)

## Audit Kategorileri

### 1. Authentication
- [ ] JWT token validation doğru mu?
- [ ] Token expiry kontrol ediliyor mu?
- [ ] Refresh token rotation var mı?
- [ ] Logout'ta token revoke ediliyor mu?

**Kontrol edilecek pattern'ler:**
```typescript
// KÖTÜ: Token verify edilmeden kullanım
const decoded = jwt.decode(token);

// İYİ: Verify ile kontrol
const decoded = jwt.verify(token, secret);
```

### 2. Authorization
- [ ] Her endpoint'te auth middleware var mı?
- [ ] Role-based access control doğru mu?
- [ ] Ownership check gerekli yerlerde yapılıyor mu?
- [ ] IDOR (Insecure Direct Object Reference) var mı?

**Kontrol edilecek pattern'ler:**
```typescript
// KÖTÜ: Ownership check yok
const order = await prisma.order.findUnique({ where: { id } });

// İYİ: User ownership check
const order = await prisma.order.findUnique({
  where: { id, userId: request.user.id }
});
```

### 3. Input Validation
- [ ] Request body validate ediliyor mu?
- [ ] Path/query params validate ediliyor mu?
- [ ] File upload kontrolü var mı?
- [ ] Content-Type kontrolü var mı?

**Tehlikeli input'lar:**
- SQL karakterleri: `' " ; --`
- Script tags: `<script>`, `javascript:`
- Path traversal: `../`, `..\\`

### 4. SQL Injection
- [ ] Raw SQL kullanılıyor mu?
- [ ] Parameterized query kullanılmış mı?
- [ ] Prisma raw query güvenli mi?

**Kontrol edilecek pattern'ler:**
```typescript
// KÖTÜ: String concatenation
prisma.$queryRaw`SELECT * FROM users WHERE name = '${name}'`

// İYİ: Parameterized
prisma.$queryRaw`SELECT * FROM users WHERE name = ${name}`
```

### 5. XSS (Cross-Site Scripting)
- [ ] User input HTML encode ediliyor mu?
- [ ] CSP headers var mı?
- [ ] JSON response'da HTML escape var mı?

### 6. Sensitive Data Exposure
- [ ] Password hash loglanıyor mu? (HAYIR olmalı)
- [ ] API key'ler hardcoded mı?
- [ ] Error response'da stack trace var mı?
- [ ] PII (Personally Identifiable Info) loglanıyor mu?

**Hassas alanlar:**
- `password`, `password_hash`
- `token`, `refreshToken`, `apiKey`
- `email`, `phone`, `ip_address`

### 7. Rate Limiting
- [ ] Login endpoint rate limit var mı?
- [ ] Password reset rate limit var mı?
- [ ] API endpoint'lerde rate limit var mı?

### 8. RLS (Row Level Security)
`iwent_database_schema_v2.sql` dosyasındaki RLS policy'lerini kontrol et:
- [ ] Sensitive tablolarda RLS aktif mi?
- [ ] Policy'ler doğru tanımlı mı?
- [ ] `auth.uid()` doğru kullanılmış mı?

## Output Format

Her bulgu için:
```
## [SEVERITY] Finding Title

**Dosya:** path/to/file.ts:line
**Kategori:** Authentication/Authorization/etc.
**Açıklama:** Ne yanlış
**Risk:** Olası saldırı senaryosu
**Öneri:** Nasıl düzeltilmeli
```

Severity levels:
- 🔴 **CRITICAL**: Immediate fix required
- 🟠 **HIGH**: Fix before release
- 🟡 **MEDIUM**: Should fix
- 🟢 **LOW**: Nice to fix

## Referans
- `iWent_Backend_PRD.md` - Section 2 (Authorization)
- `iwent_database_schema_v2.sql` - RLS policies
- OWASP Top 10
