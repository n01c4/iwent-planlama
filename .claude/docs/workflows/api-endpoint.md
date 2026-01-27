# Workflow: New API Endpoint

Use this for adding or changing a single endpoint.

## Inputs
- `iwent_openapi_v2.yaml`
- `openapi_v3_additions.yaml` (new definitions)
- `iwent_database_schema_v2.sql` (tables and relations)
- Relevant feature file (for frontend requirements)

## Steps
1) Read specs and feature notes; confirm request and response shapes.
2) Plan with TodoWrite:
   - [ ] Update Prisma schema (if needed)
   - [ ] Repository layer
   - [ ] Service layer
   - [ ] Controller/route handler
   - [ ] Validation schema (Zod)
   - [ ] Unit tests
   - [ ] Integration tests
3) Approval: Level 2 (logic change/new endpoint). Share route, auth, validation, impacted files, and whether breaking.
4) Implement in module structure (controller/service/repo/schema/types).
5) Tests:
   - Unit test service logic and edge cases.
   - Integration test the route (auth, validation errors, happy path).
6) Update OpenAPI spec if applicable and mention any frontend impact.
7) Report progress and results.
