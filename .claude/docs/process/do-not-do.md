# Things Not To Do

## Absolute Prohibitions
- Do not change the technical stack (Fastify, TypeScript, Prisma, PostgreSQL/Supabase, JWT, Supabase Realtime/Storage, modular monolith).
- Do not add new user types beyond User, Organizer, Admin.
- Do not build admin panel backend work for MVP without approval.
- Do not introduce backend changes that break frontend flows or API compatibility without coordination.
- Do not run critical operations without approval: database migrations, breaking API changes, security changes, production deployment, data deletion.
- Do not introduce security vulnerabilities: SQL injection risk, XSS, unprotected CSRF, hardcoded credentials, logging sensitive data, open CORS.

## Be Careful About
- Over-engineering: avoid needless abstractions, unused utilities, speculative features, premature optimization, overly generic solutions. Follow YAGNI.
- Scope creep: do not add unrequested features or bonuses; stay within scope unless approved.
- Skipping tests: do not leave work untested; include edge cases and integration coverage.
- Missing documentation: keep README, API docs, and code comments updated when behavior changes.
