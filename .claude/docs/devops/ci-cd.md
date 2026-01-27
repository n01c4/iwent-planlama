# CI/CD Pipelines

## Overview
We use GitHub Actions for our CI/CD pipelines.
- **CI**: Runs on every push to `develop` and `main`, and all PRs to `develop`.
- **CD**: Deploys to Staging from `develop`, and Production from `main`.

## Pipeline Configuration (`.github/workflows/ci.yml`)

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
    environment: production  # Requires manual approval in GitHub
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Supabase (production)
        run: |
          npx supabase link --project-ref ${{ secrets.PROD_PROJECT_REF }}
          npx supabase db push
          npx supabase functions deploy
```
