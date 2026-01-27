# Workflow: Bug Fix

Use this for logic bugs, regressions, or incidents.

## Inputs
- Relevant module files (service/repo/controller).
- Existing tests around the area.
- Logs or reproduction steps.

## Steps
1) Reproduce and capture the exact failing behavior and inputs.
2) Root cause analysis:
   - Identify the gap (e.g., missing check, race condition, bad default).
   - List affected code paths and data.
3) Plan with TodoWrite:
   - [ ] Add failing test first (unit or integration).
   - [ ] Implement fix with minimal scope.
   - [ ] Add any guardrails (validation, locks, feature flags).
   - [ ] Update docs or comments if behavior changes.
4) Approval: Level 2 if logic change; Level 3 if touching DB, auth, or payments.
5) Run tests relevant to the fix plus smoke tests for adjacent flows.
6) If concurrency or perf-related, add load/concurrency checks where feasible.
7) Report fix summary, tests run, and any residual risks.
