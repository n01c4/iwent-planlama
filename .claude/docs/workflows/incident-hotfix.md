# Incident Response & Hotfix Workflow

## When to use this?
*   Production is down.
*   Critical bug affecting payments or data integrity.
*   Security vulnerability discovered in production.

## Process

### 1. Detection & Triage
*   **Source**: Monitoring alerts, user reports, Sentry logs.
*   **Assess Severity**:
    *   **Critical**: Immediate action required (Service down, Data loss).
    *   **High**: Fix ASAP (Core feature broken).
    *   **Medium**: Fix in next regular release.

### 2. Immediate Mitigation (The "Stop the Bleeding" Phase)
If a recent deployment caused the issue:
1.  **Revert Code**:
    ```bash
    git revert HEAD
    git push origin main
    ```
    *This triggers the CI/CD pipeline to deploy the previous stable version.*

2.  **Database Rollback** (If migration caused it):
    *   **Warning**: This can cause data loss. Only do this if strictly necessary.
    ```bash
    npx prisma migrate resolve --rolled-back <migration_name>
    ```

### 3. Hotfix Implementation
1.  **Create Branch**: `hotfix/issue-description` from `main`.
2.  **Reproduce**: Write a test case that reproduces the bug.
3.  **Fix**: Implement the fix.
4.  **Test**: Verify the fix locally and on Staging.
5.  **Deploy**: Merge to `main` (requires approval).

### 4. Post-Mortem
After the incident is resolved:
1.  **Analyze Root Cause**: Why did this happen? (e.g., missing test, race condition).
2.  **Preventive Actions**: Add tests, improve monitoring, update docs.
3.  **Document**: Update `debugging.md` with new findings if relevant.
