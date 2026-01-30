# Phase 8 Implementation Plan: AI + NLP Search

> **Goal:** Implement Phase 8 requirements to enable AI-powered natural language search functionality for the iWent platform.
>
> **Current Status:** Phase 7 (Notifications & Moderation) completed. Phase 8 not yet started.
>
> **Estimated Duration:** 3 weeks (as per PRD line 445)

---

## Executive Summary

Phase 8 introduces AI-powered features to enhance user experience, with the primary deliverable being **Natural Language Search (NLP Search)**. According to the PRD, this feature allows users to search for events using natural language queries like "Cuma akşamı İstanbul'da canlı müzik konserleri" instead of basic keyword matching.

### Key Deliverables

1. **NLP Search Endpoint**: `POST /search/natural` - AI-powered semantic search
2. **AI Provider Integration**: Gemini API integration for query understanding
3. **Fallback Mechanism**: Graceful degradation to keyword search
4. **Performance Optimization**: Target P95 <1.5s response time
5. **Additional AI Features** (from Roadmap):
   - AI SEO-friendly description generation
   - AI visual generation (Nano banana pro)
   - Marketing copy variants
   - ICS calendar feed
   - Calendar view for users

**Note:** This plan focuses on **NLP Search** as the primary Phase 8 feature. Other AI features (description generation, visual generation) are documented in the roadmap but will be addressed based on priority.

---

## Current State Analysis

### What Exists (✅)

1. **Basic Keyword Search**: `GET /search` endpoint in [search.service.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.service.ts)
   - String matching with `contains` mode (case-insensitive)
   - Searches across events, venues, artists
   - Returns basic structured results

2. **Database Foundation**:
   - Full-text search index: `idx_events_fulltext_search` (Turkish language support)
   - `pg_trgm` extension enabled for fuzzy search
   - Index comment indicates NLP intentions

3. **API Specification**: Endpoint listed in [openapi_v3_additions.yaml:34](c:\Users\merti\Downloads\iwent-planlama\openapi_v3_additions.yaml#L34)

### What's Missing (❌)

1. **AI Integration**:
   - No Gemini/OpenAI SDK installed in `package.json`
   - No API key configuration in `.env`
   - No AI service module

2. **NLP Search Implementation**:
   - No `POST /search/natural` route handler
   - No NLP-specific request/response schemas
   - No semantic query understanding logic
   - No query parsing/intent extraction

3. **Infrastructure**:
   - No vector/embedding storage (optional for Phase 1)
   - No NLP-specific rate limiting
   - No performance monitoring for AI calls
   - No caching strategy for common queries

4. **Error Handling**:
   - No fallback mechanism to keyword search
   - No retry logic for AI API failures
   - No graceful degradation strategy

---

## Requirements Breakdown

### 1. Functional Requirements

#### NLP Search Endpoint (POST /search/natural)

**Purpose:** Accept natural language queries and return semantically relevant results.

**Example Queries:**
- "Cuma akşamı İstanbul'da canlı müzik konserleri"
- "Bu hafta sonu İzmir'de açık hava etkinlikleri"
- "Gelecek ay Ankara'da stand-up gösterileri"

**Request Schema:**
```typescript
{
  query: string;          // Natural language query (max 500 chars)
  limit?: number;         // Max results per type (default: 10, max: 50)
  userPreferences?: {     // Optional user context
    city?: string;
    categories?: string[];
    priceRange?: { min?: number; max?: number };
  };
}
```

**Response Schema:**
```typescript
{
  results: {
    events: SearchResultItem[];
    venues: SearchResultItem[];
    artists: SearchResultItem[];
  };
  metadata: {
    query: string;              // Original query
    parsedIntent: {             // AI-extracted intent
      searchType: 'event' | 'venue' | 'artist' | 'mixed';
      dateRange?: { start?: string; end?: string };
      location?: string;
      categories?: string[];
      keywords?: string[];
    };
    fallbackUsed: boolean;      // True if AI failed, keyword search used
    responseTimeMs: number;
  };
  total: number;
}
```

**Performance Requirements:**
- P95 response time: <1.5 seconds (PRD Section 6, line 426)
- This includes AI API call + database query time

#### Fallback Strategy

**Rule (PRD Section 8, line 456):**
> Risk: NLP search accuracy → Fallback to keyword search

**Implementation:**
1. If AI API fails (timeout, error, rate limit), fallback to keyword search
2. If AI returns no results but intent is valid, retry with relaxed filters
3. If AI confidence score < 0.6, combine AI + keyword results
4. Always set `fallbackUsed: true` in metadata when degradation occurs

### 2. Technical Requirements

#### AI Provider Integration (Gemini API)

**Why Gemini?**
- Mentioned in Technical Roadmap [iWent_Technical_Roadmap.md:86](c:\Users\merti\Downloads\iwent-planlama\iWent_Technical_Roadmap.md#L86)
- Cost-effective for Turkish language support
- Fast inference for real-time search

**Required Dependencies:**
```json
{
  "@google/generative-ai": "^0.21.0"  // Gemini SDK
}
```

**Environment Variables:**
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp  # Fast inference model
NLP_SEARCH_TIMEOUT=1000             # 1s timeout for AI call
NLP_SEARCH_CACHE_TTL=3600           # 1h cache for common queries
```

#### Database Queries

**Option 1: Enhanced Full-Text Search (Recommended for MVP)**
- Use existing `idx_events_fulltext_search` index
- Leverage `to_tsquery` with extracted keywords from AI
- No schema changes required

**Option 2: Vector Search (Future Enhancement)**
- Install `pgvector` extension
- Add `embedding` column to `events` table
- Store semantic embeddings for events
- Use cosine similarity for semantic matching
- **NOT required for Phase 8 MVP**

### 3. Non-Functional Requirements

#### Performance
- AI API call: <800ms (P95)
- Database query: <500ms (P95)
- Total response time: <1.5s (P95)
- Cache hit rate: >50% for common queries

#### Security
- Rate limiting: 30 requests/minute per user (lower than keyword search)
- Input sanitization: Max 500 chars, no SQL injection
- API key protection: Never expose in responses

#### Monitoring
- Track AI API latency separately
- Log failed queries for retraining
- Monitor fallback frequency
- Alert if fallback rate >20%

---

## Implementation Plan

### Step 1: Project Setup & Dependencies

**Files to Modify:**
- [backend/package.json](c:\Users\merti\Downloads\iwent-planlama\backend\package.json)
- [backend/.env.example](c:\Users\merti\Downloads\iwent-planlama\backend\.env.example)
- [backend/src/config/index.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\config\index.ts)

**Actions:**
1. Install Gemini SDK: `pnpm add @google/generative-ai`
2. Add environment variables to `.env.example`:
   ```env
   # AI Features (Phase 8)
   GEMINI_API_KEY=
   GEMINI_MODEL=gemini-2.0-flash-exp
   NLP_SEARCH_TIMEOUT=1000
   NLP_SEARCH_CACHE_TTL=3600
   ```
3. Update config to load AI settings
4. Create `.env` file with actual API key (not committed)

---

### Step 2: AI Service Module

**New Files:**
- `backend/src/modules/ai/ai.service.ts`
- `backend/src/modules/ai/ai.types.ts`
- `backend/src/modules/ai/index.ts`

**Responsibilities:**
- Initialize Gemini client
- Parse natural language queries into structured intent
- Handle timeouts and retries
- Return parsed intent object

**Key Functions:**
```typescript
class AIService {
  // Parse natural language query into structured intent
  async parseSearchQuery(query: string): Promise<SearchIntent>

  // Future: Generate SEO descriptions
  async generateDescription(event: Event): Promise<string>

  // Future: Generate marketing copy variants
  async generateCopyVariants(event: Event): Promise<string[]>
}
```

**SearchIntent Interface:**
```typescript
interface SearchIntent {
  searchType: 'event' | 'venue' | 'artist' | 'mixed';
  keywords: string[];
  dateRange?: { start?: Date; end?: Date };
  location?: string;
  categories?: string[];
  priceRange?: { min?: number; max?: number };
  confidence: number;  // 0-1 score
}
```

**Error Handling:**
- Timeout after 1 second
- Catch API errors (rate limit, invalid key, network)
- Return null on failure (triggers fallback)
- Log all errors for debugging

---

### Step 3: Enhanced Search Service

**Files to Modify:**
- [backend/src/modules/search/search.service.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.service.ts)
- [backend/src/modules/search/search.schema.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.schema.ts)

**New Functions:**
```typescript
class SearchService {
  // Existing: keyword search
  async search(query: SearchQueryInput): Promise<SearchResults>

  // NEW: NLP-powered search
  async naturalSearch(input: NaturalSearchInput): Promise<NaturalSearchResults>

  // PRIVATE: Build WHERE clause from AI intent
  private buildWhereFromIntent(intent: SearchIntent): Prisma.EventWhereInput

  // PRIVATE: Execute search with intent
  private async executeIntentSearch(intent: SearchIntent, limit: number): Promise<SearchResults>
}
```

**Search Strategy:**
1. Call `aiService.parseSearchQuery(query)`
2. If AI returns intent with confidence >0.6:
   - Use `to_tsquery` with extracted keywords
   - Apply date/location/category filters from intent
   - Rank by relevance score + likeCount
3. If AI fails or confidence <0.6:
   - Fallback to existing keyword search
   - Set `fallbackUsed: true`
4. Return unified response

**Ranking Algorithm:**
```typescript
// Combine relevance + popularity
score = (text_match_score * 0.7) + (popularity_score * 0.3)

// Text match: ts_rank() from PostgreSQL
// Popularity: normalize(likeCount + ticketsSold)
```

---

### Step 4: API Endpoint & Schema

**Files to Modify:**
- [backend/src/modules/search/search.routes.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.routes.ts)
- [backend/src/modules/search/search.schema.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.schema.ts)

**New Route:**
```typescript
// POST /search/natural
fastify.post('/natural', {
  schema: {
    body: naturalSearchSchema,
    response: { 200: naturalSearchResponseSchema }
  },
  preHandler: [
    rateLimitMiddleware({ max: 30, window: '1m' })  // Lower limit
  ],
  handler: async (request, reply) => {
    const startTime = Date.now();
    const result = await searchService.naturalSearch(request.body);
    const responseTimeMs = Date.now() - startTime;

    return {
      ...result,
      metadata: {
        ...result.metadata,
        responseTimeMs
      }
    };
  }
});
```

**Zod Schemas:**
```typescript
export const naturalSearchSchema = z.object({
  query: z.string().min(3).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  userPreferences: z.object({
    city: z.string().optional(),
    categories: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional()
  }).optional()
});

export const naturalSearchResponseSchema = z.object({
  results: z.object({
    events: z.array(searchResultItemSchema),
    venues: z.array(searchResultItemSchema),
    artists: z.array(searchResultItemSchema)
  }),
  metadata: z.object({
    query: z.string(),
    parsedIntent: z.object({
      searchType: z.enum(['event', 'venue', 'artist', 'mixed']),
      dateRange: z.object({ /* ... */ }).optional(),
      location: z.string().optional(),
      categories: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional()
    }),
    fallbackUsed: z.boolean(),
    responseTimeMs: z.number()
  }),
  total: z.number()
});
```

---

### Step 5: Caching Strategy

**Files to Modify:**
- [backend/src/shared/cache/redis.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\shared\cache\redis.ts)

**Cache Keys:**
```typescript
// AI intent cache (1 hour)
nlp:intent:{hash(query)} → SearchIntent

// Search results cache (5 minutes)
nlp:results:{hash(query+filters)} → NaturalSearchResults
```

**Implementation:**
1. Hash query using SHA-256
2. Check cache before calling AI API
3. Store intent separately from results
4. Invalidate results cache on event updates (existing logic)

**Cache Invalidation:**
- Intent cache: Never invalidate (queries don't change)
- Results cache: Invalidate when events update
- Cache warming: Pre-cache popular queries (future)

---

### Step 6: Rate Limiting & Security

**Files to Modify:**
- [backend/src/shared/middleware/rate-limit.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\shared\middleware\rate-limit.ts)

**New Rate Limit:**
```typescript
{
  route: '/search/natural',
  authenticated: {
    max: 30,      // 30 requests/minute (vs 60 for keyword search)
    window: '1m'
  },
  public: {
    max: 10,      // 10 requests/minute
    window: '1m'
  }
}
```

**Security Measures:**
1. Input validation: Max 500 chars, no special chars
2. Query sanitization: Strip HTML, SQL injection attempts
3. API key protection: Never log or expose in responses
4. User-based rate limiting (not IP-based for auth users)

---

### Step 7: Error Handling & Monitoring

**Files to Modify:**
- [backend/src/modules/search/search.service.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.service.ts)
- [backend/src/shared/utils/logger.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\shared\utils\logger.ts)

**Error Scenarios:**
1. **AI API Timeout**: Fallback to keyword search
2. **AI API Rate Limit**: Fallback to keyword search
3. **Invalid API Key**: Log error, fallback to keyword search
4. **Low Confidence (<0.6)**: Combine AI + keyword results
5. **No Results**: Suggest relaxed filters

**Logging:**
```typescript
logger.info('nlp_search_request', {
  query,
  userId,
  intentConfidence,
  fallbackUsed,
  responseTimeMs,
  resultsCount
});

logger.error('nlp_search_ai_failure', {
  query,
  error: error.message,
  fallbackUsed: true
});
```

**Monitoring Metrics:**
- `nlp_search_requests_total` (counter)
- `nlp_search_response_time` (histogram)
- `nlp_search_ai_failures` (counter)
- `nlp_search_fallback_rate` (gauge)
- `nlp_search_cache_hit_rate` (gauge)

---

### Step 8: Testing

**New Test Files:**
- `backend/src/modules/ai/ai.service.test.ts`
- `backend/src/modules/search/search.service.nlp.test.ts`
- `backend/src/modules/search/search.routes.nlp.test.ts`

**Test Cases:**

#### Unit Tests (ai.service.test.ts)
1. ✅ Parse simple query: "İstanbul'da konser"
2. ✅ Parse complex query with date: "Gelecek hafta Ankara'da tiyatro"
3. ✅ Handle timeout (mock delay >1s)
4. ✅ Handle API error (mock 500 response)
5. ✅ Return null on failure
6. ✅ Extract location, date, categories correctly

#### Integration Tests (search.service.nlp.test.ts)
1. ✅ NLP search returns results matching intent
2. ✅ Fallback to keyword search on AI failure
3. ✅ Combine AI + keyword results on low confidence
4. ✅ Apply user preferences (city, categories)
5. ✅ Rank results by relevance + popularity
6. ✅ Cache intent and results correctly

#### E2E Tests (search.routes.nlp.test.ts)
1. ✅ POST /search/natural with valid query returns 200
2. ✅ Rate limiting works (31st request returns 429)
3. ✅ Invalid query (501 chars) returns 400
4. ✅ Response includes metadata with parsedIntent
5. ✅ fallbackUsed flag is set correctly
6. ✅ Performance: P95 <1.5s (load test with k6)

**Test Coverage Target:**
- Unit tests: >80%
- Integration tests: >70%
- Critical path: 100% (search flow, fallback logic)

---

### Step 9: Documentation

**Files to Create/Update:**
- `backend/src/modules/ai/README.md` (new)
- `backend/src/modules/search/README.md` (update)
- [iwent_openapi_v2.yaml](c:\Users\merti\Downloads\iwent-planlama\iwent_openapi_v2.yaml) (update)
- [CHANGELOG.md](c:\Users\merti\Downloads\iwent-planlama\CHANGELOG.md) (update)

**Documentation Sections:**

#### AI Module README
- Purpose and architecture
- Gemini API setup instructions
- Environment variables
- Usage examples
- Error handling guide
- Future enhancements (embeddings, vector search)

#### Search Module README (Updated)
- Add NLP search section
- Query examples (Turkish)
- Fallback behavior explanation
- Performance benchmarks
- Caching strategy

#### OpenAPI Spec (Updated)
- Add `/search/natural` endpoint spec
- Include request/response schemas
- Document error responses (400, 429, 500)
- Add example queries and responses

#### CHANGELOG.md
```markdown
## [Phase 8] - 2026-02-XX

### Added
- 🤖 AI-powered natural language search (POST /search/natural)
- 🔌 Gemini API integration for query understanding
- 🛡️ Fallback mechanism to keyword search
- 📊 NLP search monitoring metrics
- 🗄️ Redis caching for AI intents and results

### Changed
- Enhanced search service with semantic ranking
- Added NLP-specific rate limiting (30 req/min)

### Performance
- NLP search P95: <1.5s (target met)
- Cache hit rate: >50%
```

---

### Step 10: Deployment & Rollout

**Pre-Deployment Checklist:**
- [ ] Gemini API key added to production `.env`
- [ ] Rate limiting tested on staging
- [ ] Cache TTL configured correctly
- [ ] Monitoring dashboards created
- [ ] Error alerts configured (PagerDuty/Slack)
- [ ] Performance benchmarks run (k6 load test)
- [ ] Fallback mechanism tested (disable AI API)
- [ ] Database indexes verified (`EXPLAIN ANALYZE`)

**Rollout Strategy:**
1. **Staging Deployment**:
   - Deploy to staging environment
   - Run E2E tests
   - Load test with 100 concurrent users
   - Verify P95 <1.5s

2. **Canary Rollout (10% Traffic)**:
   - Enable for 10% of users
   - Monitor error rate, response time
   - Compare NLP vs keyword search usage
   - If metrics good after 24h, proceed

3. **Full Production Rollout**:
   - Enable for all users
   - Monitor for 48 hours
   - Track adoption metrics (target: >30% usage in 3 months)

**Rollback Plan:**
- If error rate >5%, rollback immediately
- If P95 >2s, disable NLP search (feature flag)
- If AI API cost >$100/day, reduce rate limits

---

## Critical Files to Modify

| File Path | Change Type | Purpose |
|-----------|-------------|---------|
| [backend/package.json](c:\Users\merti\Downloads\iwent-planlama\backend\package.json) | Add dependency | Install @google/generative-ai |
| [backend/.env.example](c:\Users\merti\Downloads\iwent-planlama\backend\.env.example) | Add vars | Document AI config |
| [backend/src/config/index.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\config\index.ts) | Update config | Load AI settings |
| `backend/src/modules/ai/ai.service.ts` | Create | AI service for Gemini |
| `backend/src/modules/ai/ai.types.ts` | Create | TypeScript types |
| `backend/src/modules/ai/index.ts` | Create | Module exports |
| [backend/src/modules/search/search.service.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.service.ts) | Enhance | Add naturalSearch() |
| [backend/src/modules/search/search.schema.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.schema.ts) | Add schemas | NLP request/response |
| [backend/src/modules/search/search.routes.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\modules\search\search.routes.ts) | Add route | POST /natural endpoint |
| [backend/src/shared/cache/redis.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\shared\cache\redis.ts) | Add cache keys | NLP caching strategy |
| [backend/src/shared/middleware/rate-limit.ts](c:\Users\merti\Downloads\iwent-planlama\backend\src\shared\middleware\rate-limit.ts) | Add limits | NLP rate limiting |

---

## Verification & Testing

### Manual Testing Checklist

**Test Queries (Turkish):**
1. "İstanbul'da bu hafta sonu konser" → Should return Istanbul events this weekend
2. "Ankara'da stand-up gösterisi" → Should return comedy events in Ankara
3. "Gelecek ay İzmir'de açık hava etkinliği" → Should filter by date + location
4. "200 TL altında tiyatro bileti" → Should apply price filter
5. "Canlı müzik bar" → Should return both events and venues

**Expected Behavior:**
- Query processed in <1.5s
- `parsedIntent` shows extracted keywords, location, date
- Results match intent semantically (not just keyword match)
- If AI fails, fallback to keyword search with `fallbackUsed: true`

### Automated Testing

**Run Commands:**
```bash
# Unit tests
pnpm test src/modules/ai/ai.service.test.ts
pnpm test src/modules/search/search.service.nlp.test.ts

# Integration tests
pnpm test:integration src/modules/search/search.routes.nlp.test.ts

# Load test (k6)
k6 run tests/load/nlp-search.js --vus 100 --duration 60s

# Check P95 latency
# Should be <1.5s for 95% of requests
```

**Success Criteria:**
- All tests pass (coverage >80%)
- Load test: P95 <1.5s, P99 <2.5s
- No memory leaks (heap size stable)
- Cache hit rate >50% after warmup

---

## Risk Mitigation

### Risk 1: AI API Costs Exceed Budget
**Mitigation:**
- Set daily budget alert ($100/day)
- Cache aggressively (1h TTL for intents)
- Implement rate limiting (30 req/min)
- Use `gemini-2.0-flash-exp` (fast + cheap model)

### Risk 2: Low Search Accuracy (<70%)
**Mitigation:**
- Fine-tune prompts with real user queries
- Combine AI + keyword results for low confidence
- Collect feedback ("Was this helpful?") for retraining
- Fallback to keyword search maintains baseline quality

### Risk 3: Performance Degradation (P95 >1.5s)
**Mitigation:**
- Timeout AI calls at 1s (fail fast)
- Use Redis caching (50%+ hit rate target)
- Optimize database queries with EXPLAIN ANALYZE
- Consider dedicated AI endpoint if needed

### Risk 4: Turkish Language Support Issues
**Mitigation:**
- Use Gemini (better Turkish support vs GPT)
- Provide Turkish examples in system prompt
- Test with Turkish-specific queries (ç, ğ, ı, ş)
- Fallback to keyword search if intent unclear

---

## Future Enhancements (Post-Phase 8)

### Phase 9+: Advanced AI Features

1. **Vector Search with pgvector**:
   - Add `embedding` column to `events` table
   - Pre-compute embeddings for all events
   - Use cosine similarity for semantic search
   - 10x faster than LLM calls

2. **Personalized Search**:
   - Use user history (liked events, categories)
   - Personalized ranking algorithm
   - "Events for you" recommendations

3. **AI Description Generation** (Roadmap Phase 8):
   - `POST /ai/events/description`
   - Generate SEO-friendly descriptions
   - Organize-facing feature

4. **AI Visual Generation** (Roadmap Phase 8):
   - `POST /ai/events/visual`
   - Generate event banners with Nano banana pro
   - Organizer-facing feature

5. **Marketing Copy Variants** (Roadmap Phase 8):
   - `POST /ai/events/copy-variants`
   - Generate A/B test copy
   - Organizer-facing feature

6. **ICS Calendar Feed** (Roadmap Phase 8):
   - `GET /calendar/feeds/ics`
   - Export user events to Apple/Google Calendar
   - User-facing feature

---

## Success Metrics

### Technical Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| P95 Response Time | <1.5s | Prometheus histogram |
| P99 Response Time | <2.5s | Prometheus histogram |
| Cache Hit Rate | >50% | Redis stats |
| Fallback Rate | <20% | Application logs |
| Error Rate | <2% | Application logs |

### Business Metrics (3 Months)

| Metric | Target (PRD Line 117) | Measurement |
|--------|---------------------|-------------|
| NLP Search Adoption | >30% | Analytics |
| User Satisfaction | >4.0/5.0 | In-app survey |
| Search CTR | >40% | Click-through rate |
| Query Success Rate | >70% | Results > 0 |

---

## Approval & Next Steps

This plan covers the complete implementation of **Phase 8: AI + NLP Search** with focus on the primary deliverable (NLP Search endpoint). Other AI features from the roadmap (description generation, visual generation) are documented for future phases.

**Implementation Duration:** 3 weeks (as per PRD)
- Week 1: Setup, AI service, enhanced search service
- Week 2: API endpoint, caching, testing
- Week 3: Documentation, deployment, monitoring

**After Approval:**
1. Begin with Step 1 (Dependencies & Setup)
2. Implement incrementally (Steps 2-10)
3. Test thoroughly before staging deployment
4. Canary rollout to production (10% → 100%)

---

*Plan Version: 1.0*
*Created: 2026-01-30*
*PRD Reference: [iWent_Backend_PRD.md](c:\Users\merti\Downloads\iwent-planlama\iWent_Backend_PRD.md) v3.0*
*Roadmap Reference: [iWent_Technical_Roadmap.md](c:\Users\merti\Downloads\iwent-planlama\iWent_Technical_Roadmap.md) v2.0*
