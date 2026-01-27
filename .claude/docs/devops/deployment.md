# Deployment and DevOps

## Environments
| Environment | URL | Branch | Auto Deploy |
|-------------|-----|--------|-------------|
| Development | localhost:3000 | - | No |
| Staging | staging.api.iwent.com.tr | develop | Yes |
| Production | api.iwent.com.tr | main | Manual |

## CI/CD Pipeline (GitHub Actions Example)
```yaml
name: CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: iwent_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm prisma generate
      - run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/iwent_test
      - run: pnpm test:coverage
      - run: pnpm lint

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Supabase (staging)
        run: |
          npx supabase link --project-ref ${{ secrets.STAGING_PROJECT_REF }}
          npx supabase db push
          npx supabase functions deploy

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Supabase (production)
        run: |
          npx supabase link --project-ref ${{ secrets.PROD_PROJECT_REF }}
          npx supabase db push
          npx supabase functions deploy
```

## Deployment Checklist (Production)
- All tests passing.
- Staging deployed and validated.
- Database migration prepared and tested.
- Rollback plan documented.
- Frontend informed if any breaking change.
- Monitoring and alerts configured.
- Team notified (Slack).
- Deployment window is safe (off-peak if possible).

## Database Migration Workflow
```bash
# 1. Create migration locally
npx prisma migrate dev --name <migration_name>

# 2. Review migration
cat prisma/migrations/*/migration.sql

# 3. Deploy to staging
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# 4. Test on staging
# ...manual tests...

# 5. Deploy to production (after approval)
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy
```

## Rollback Procedure
```bash
# 1. Detect issue (monitoring, logs, user reports)

# 2. Quick rollback (code)
git revert HEAD
git push origin main

# 3. Database rollback (if needed; risk of data loss)
npx prisma migrate resolve --rolled-back <migration_name>

# 4. Post-mortem
# - Root cause
# - Preventive measures
# - Documentation updates
```

## Environment Variables
```bash
# .env.example (committed)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
IYZICO_API_KEY="..."
IYZICO_SECRET_KEY="..."
GEMINI_API_KEY="..."
SENDGRID_API_KEY="..."
FIREBASE_PROJECT_ID="..."
SENTRY_DSN="..."
REDIS_URL="redis://..."

# Never commit:
# - .env with production values
# - Any *_SECRET values
# - Production *_KEY values
```
