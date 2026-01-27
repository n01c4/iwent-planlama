# Workflow: Database Migration

Use this for schema changes, including new columns and tables.

## Inputs
- `iwent_database_schema_v2.sql`
- Prisma schema
- Related PRD or feature file

## Approval
- Level 3 (critical). Include migration SQL, rollback SQL, affected modules, and risk notes.

## Steps
1) Analyze current schema and confirm requirements.
2) Prepare migration SQL and rollback SQL; share both for approval.
3) Plan with TodoWrite:
   - [ ] Generate migration (`npx prisma migrate dev --name <name>`)
   - [ ] Review generated SQL
   - [ ] Update Prisma schema (if not generated)
   - [ ] Update seeds/fixtures if required
   - [ ] Unit tests for new constraints/logic
   - [ ] Integration tests around affected endpoints
4) After approval, apply migration to dev and staging.
5) Validate on staging (queries, flows, and perf).
6) Deploy to production only after staging validation and explicit approval.
7) Keep rollback steps ready: `npx prisma migrate resolve --rolled-back <migration_name>` and code revert if needed.
