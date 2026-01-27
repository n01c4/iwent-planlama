# Workflow: Building and Release Prep

Use this when preparing artifacts for deployment or verifying build readiness.

## Build Steps
1) Install dependencies: `pnpm install`.
2) Generate Prisma client: `pnpm prisma generate`.
3) Run build (if configured): `pnpm build`.
4) Verify TypeScript types (if separate): `pnpm tsc --noEmit`.
5) Lint if available: `pnpm lint`.

## Pre-Release Checklist
- Tests: run unit, integration, and coverage commands relevant to the change.
- Database: migrations reviewed and applied to staging; rollback plan documented.
- API: OpenAPI specs updated for any new/changed endpoints.
- Environment: `.env.example` updated when new variables are added.
- Performance: spot-check hot paths if new queries were added.
- Security: confirm no secrets committed; review auth and access rules for new routes.

## Packaging and Handover
- Ensure CI is green for the release commit.
- Attach migration notes and rollout/rollback steps in the release notes or PR.
- Notify frontend if any request/response shape changed.
- For production deploys, follow `Deployment Checklist` in `devops/deployment.md` and seek the required approval level.
