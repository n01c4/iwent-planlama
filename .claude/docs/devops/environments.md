# Environments & Configuration

## Environment Strategy

| Environment | URL | Branch | Deployment | Auth Level |
|-------------|-----|--------|------------|------------|
| **Development** | `localhost:3000` | Local Feature Branches | Manual (Local) | Mock/Dev |
| **Staging** | `staging.api.iwent.com.tr` | `develop` | Automated (CI/CD) | Dev/Test |
| **Production** | `api.iwent.com.tr` | `main` | Manual Approval | Real Users |

## Environment Variables

We manage configuration via `.env` files.

### Template (`.env.example`)
This file is committed to git. It contains keys but **no secrets**.

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Third Party
IYZICO_API_KEY="..."
IYZICO_SECRET_KEY="..."
GEMINI_API_KEY="..."
SENDGRID_API_KEY="..."
FIREBASE_PROJECT_ID="..."
SENTRY_DSN="..."
REDIS_URL="redis://..."
```

### Security Rules
1. **NEVER COMMIT** `.env` files containing real production secrets.
2. **NEVER COMMIT** any value ending in `_SECRET` or `_KEY`.
3. Use GitHub Secrets for CI/CD environment variables.
