# Workflow: Debugging a Production or Staging Issue

Use this when diagnosing failures, crashes, or unexpected behavior.

## Steps
1) Capture context:
   - Request path, method, user, correlation/request ID.
   - Timeframe, environment, frequency.
   - Logs, metrics, and recent deployments.
2) Reproduce:
   - Recreate with the same inputs; add integration or unit test reproducing the issue.
   - If not reproducible, enable targeted logging with redaction.
3) Inspect telemetry:
   - Logs: check errors, stack traces, and request IDs.
   - Metrics: look for spikes in latency, error rate, DB pool usage.
   - Health checks: `/health` and `/ready`.
4) Narrow scope:
   - Isolate modules (auth, payments, social, etc.).
   - Check downstream dependencies (Supabase, Redis, external providers).
5) Fix plan:
   - Add failing test.
   - Implement minimal fix (validation, guard, retry, lock).
   - Add observability if blind spots exist (metrics, structured logs).
   - Choose approval level (2 for logic, 3 for DB/auth/security).
6) Validate:
   - Rerun reproducing test and regression suite.
   - Run targeted load/concurrency checks if the issue was timing-related.
7) Post-fix:
   - Keep temporary logging if useful; plan removal when stable.
   - Update runbooks or docs with the root cause and fix.
   - Communicate impact, mitigation, and remaining risks.
