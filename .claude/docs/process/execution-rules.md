# Execution Rules

## Absolute Rule: Double Verification
- Always check scope, risks, and approvals before executing changes.
- Confirm assumptions with the user when anything is unclear.

## Approval Levels

### Level 1: Simple Changes (No approval; just inform)
Typical: typos, comments, import sorting, formatting, single-line bug fixes.
Format:
```
Simple change: making <short description> in <file>.
```

### Level 2: Medium Changes (Approval required)
Typical: new endpoint, new column (non-breaking), logic change, new service/utility, adding tests.
Format:
```
APPROVAL REQUIRED (Level 2)

Change:
- <description>

Affected files:
- <list>

Potential impacts:
- Breaking change? <yes/no>
- Migration needed? <yes/no>
- Frontend affected? <yes/no>

Proceed?
```

### Level 3: Critical Changes (Detailed approval mandatory)
Typical: database migration, API breaking change, security or auth change, payment logic change, data deletion.
Format:
```
CRITICAL APPROVAL REQUIRED (Level 3)

Change:
- <detailed description>

Impacts:
- Database: <yes/no> (migration needed?)
- API: <yes/no> (breaking?)
- Frontend: <yes/no> (compatibility?)
- Security: <yes/no> (needs review?)
- Payment: <yes/no> (flow affected?)

Rollback plan:
- <how to revert>

Approve?
```

## Special Cases
- Database migration: read `iwent_database_schema_v2.sql`, check Prisma schema, show migration SQL and rollback, run only after approval.
- API change: check `iwent_openapi_v2.yaml`, confirm breaking status, assess frontend impact, design deprecation, request approval.
- Security change: explain change, list risks, run OWASP Top 10 check, do not proceed without approval.
- Payment and orders: document current flow, analyze race conditions and isolation, define rollback scenarios, request approval.

## When Uncertain
- Do not assume. Present options and trade-offs, then continue after confirmation.
