# Gap Analysis Command

PRD gereksinimleri vs actual implementation karşılaştırması.

## Input
`$ARGUMENTS` - Modül adı (örn: `events`, `tickets`, `social`, `chat`, `stories`, `organizer`)

## Workflow

### 1. PRD Gereksinimlerini Çıkarma
`iWent_Backend_PRD.md` dosyasından belirtilen modül için gereksinimleri listele:
- Fonksiyonel gereksinimler
- Business rules
- Validation kuralları
- Permission gereksinimleri

### 2. OpenAPI Endpoint Listesi
`iwent_openapi_v2.yaml` dosyasından ilgili endpoint'leri çıkar:

| Endpoint | Method | Description |
|----------|--------|-------------|
| /events | GET | List events |
| /events/{id} | GET | Event detail |
| ... | ... | ... |

### 3. Implementation Durumu Kontrolü

Her endpoint için kontrol et:
- [ ] **Endpoint Exists**: Route tanımlı mı?
- [ ] **Handler Complete**: Handler implementasyonu var mı?
- [ ] **Validation**: Request validation var mı?
- [ ] **Business Logic**: PRD'deki business rules implement edilmiş mi?
- [ ] **Tests**: Test coverage var mı?

### 4. Eksik Feature Tespiti

PRD'de olup implementation'da olmayan özellikler:

```
## Missing Features

### Critical (Blocker)
- [ ] Feature X - PRD Section Y

### High Priority
- [ ] Feature Z - PRD Section W

### Medium Priority
- [ ] Feature A - PRD Section B

### Low Priority (Nice to have)
- [ ] Feature C - PRD Section D
```

### 5. Partial Implementation Tespiti

Kısmen implement edilmiş özellikler:
```
## Partial Implementations

### [Feature Name]
- PRD Requirement: "..."
- Current State: "..."
- Missing: "..."
```

## Modül Bazlı Kontrol Listesi

### Events Module
PRD Section 3.1:
- [ ] Event CRUD (create, read, update, delete)
- [ ] Draft → Published workflow
- [ ] Event duplication
- [ ] Venue association
- [ ] Artist association
- [ ] Media upload
- [ ] Attachments

### Tickets Module
PRD Section 3.1 + 3.2:
- [ ] Ticket type CRUD
- [ ] Dynamic pricing
- [ ] Discount codes
- [ ] Order creation
- [ ] Payment integration
- [ ] Ticket gifting (v3.0)
- [ ] QR code generation
- [ ] Check-in

### Social Module
PRD Section 3.2:
- [ ] Friend requests
- [ ] Friend list
- [ ] Block/unblock
- [ ] Profile visibility rules
- [ ] User stories (v3.0)

### Chat Module
PRD Section 3.2:
- [ ] Personal chat
- [ ] Event chat
- [ ] Real-time messages
- [ ] Reciprocal media (v3.0)
- [ ] Moderation

## Output Format

```
# Gap Analysis Report: [MODULE]

## Summary
- Total PRD Requirements: X
- Implemented: Y
- Partial: Z
- Missing: W
- Coverage: XX%

## Detailed Findings

### Implemented ✓
1. [Feature] - [Endpoint]

### Partial ⚠️
1. [Feature]
   - Done: ...
   - Missing: ...

### Missing ✗
1. [Feature]
   - PRD Reference: Section X.Y
   - Priority: Critical/High/Medium/Low
   - Estimated Effort: ...

## Recommendations
1. [Next steps]
```

## Referans
- `iWent_Backend_PRD.md` - Sections 3.1 ve 3.2
- `iwent_openapi_v2.yaml` - API specification
- `iwent_database_schema_v2.sql` - v3.0 updates section
