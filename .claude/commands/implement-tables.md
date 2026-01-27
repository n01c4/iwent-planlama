# Implement Tables Command

SQL schema'daki tabloları Prisma ve TypeScript'e implement etme.

## Input
`$ARGUMENTS` - Tablo adları, virgülle ayrılmış (örn: `user_stories, story_tags, story_views`)

## Workflow

### 1. SQL Schema Okuma
`iwent_database_schema_v2.sql` dosyasından belirtilen tabloları bul ve analiz et:
- Column tanımları
- Data types
- Constraints (NOT NULL, UNIQUE, CHECK)
- Foreign key relationships
- Indexes
- Default values

### 2. ENUM Kontrolü
Tablolarda kullanılan ENUM type'ları belirle:
```sql
-- Örnek: ticket_status ENUM
CREATE TYPE ticket_status AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED');
```
Prisma'da enum olarak tanımla.

### 3. Prisma Model Oluşturma
Her tablo için Prisma model yaz:
```prisma
model UserStory {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  mediaUrl      String   @map("media_url")
  mediaType     MediaType @map("media_type")
  // ... relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_stories")
  @@index([userId])
  @@index([expiresAt])
}
```

### 4. Relations Tanımlama
Foreign key'lere göre ilişkileri belirle:
- One-to-One
- One-to-Many
- Many-to-Many

Her iki tarafta da relation field'ı tanımla.

### 5. TypeScript Interface
API response/request için interface oluştur:
```typescript
interface UserStory {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  createdAt: Date;
  expiresAt: Date;
}
```

### 6. Index ve Constraint Dokümantasyonu
SQL'deki index'leri Prisma'ya aktar:
- `@@index([field])` - Normal index
- `@@unique([field])` - Unique constraint
- Composite index'ler

### 7. Migration Komutu
```bash
npx prisma migrate dev --name add_[table_names]
```

## Checklist
- [ ] Tüm column'lar Prisma'ya eklendi
- [ ] Data type'lar doğru map edildi
- [ ] ENUM'lar tanımlandı
- [ ] Relations iki yönlü tanımlı
- [ ] Index'ler eklendi
- [ ] TypeScript interface'ler oluşturuldu
- [ ] @@map ile snake_case → camelCase dönüşümü yapıldı

## Referans Dosyalar
- `iwent_database_schema_v2.sql` - Source of truth
- `prisma/schema.prisma` - Target Prisma schema

## Type Mapping
| PostgreSQL | Prisma |
|------------|--------|
| UUID | String @default(uuid()) |
| VARCHAR(n) | String |
| TEXT | String |
| INTEGER | Int |
| DECIMAL(p,s) | Decimal |
| BOOLEAN | Boolean |
| TIMESTAMPTZ | DateTime |
| DATE | DateTime @db.Date |
| JSONB | Json |
| INET | String |
| ENUM | enum (Prisma enum) |
