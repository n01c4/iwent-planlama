# Workflow: Testing and Verification

Use this when validating changes or preparing for merge.

## Steps
1) Identify scope: list modules and endpoints touched; map to required test types.
2) Unit tests:
   - Add missing cases for new branches and errors.
   - Cover validation, service logic, and edge conditions.
3) Integration tests:
   - Cover HTTP flows with auth, validation failures, and happy paths.
   - Mock external services where needed (MSW or custom stubs).
4) Data setup:
   - Use fixtures and factory helpers; avoid ad-hoc inline test data.
   - Clean up in `afterEach` to keep tests isolated.
5) Run commands:
   - `pnpm test` (full suite) or targeted `pnpm test -- --filter=<module>`.
   - `pnpm test:integration` and `pnpm test:e2e` when endpoints are affected.
   - `pnpm test:coverage` for coverage gates.
6) Analyze failures: fix root cause, not just symptoms. Re-run the relevant subset.
7) Report results: list commands run, coverage notes, and any untested risk areas.
