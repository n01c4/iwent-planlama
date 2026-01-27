# Workflow: Large Feature

Use this for multi-endpoint or multi-component work (e.g., user stories feature).

## Inputs
- Product and UX docs: relevant `.txt` feature files and PRD sections.
- API specs: `iwent_openapi_v2.yaml`, `openapi_v3_additions.yaml`.
- Database schema: `iwent_database_schema_v2.sql`.
- Roadmap: `iWent_Technical_Roadmap.md`.

## Steps
1) Comprehensive analysis: requirements, data model, storage, permissions, and integrations.
2) Plan with TodoWrite (example 15-step layout):
   - Database: validate tables and relations; update Prisma schema if needed.
   - Backend: repository, service, controller for each endpoint; validation schemas; storage integrations.
   - Tests: unit for business logic, integration for endpoints.
   - Ops: cron/edge functions if applicable.
3) Approval: Level 3 if multiple endpoints, migrations, or security-sensitive changes.
4) Implement in increments; request intermediate approval every 3–4 completed steps.
5) Testing:
   - Unit coverage >80% for new logic.
   - Integration tests for all endpoints.
   - Edge cases (expiry, permissions, visibility, limits).
6) Update API docs and any feature docs; note frontend impacts.
7) Provide final status: what shipped, tests run, and follow-ups.
