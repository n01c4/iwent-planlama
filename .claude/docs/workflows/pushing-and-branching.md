# Workflow: Branching and Pushing

## Branching
- Use short, descriptive branches: `feature/<scope>-<short-desc>` or `fix/<scope>-<short-desc>`.
- Keep one feature per branch; avoid mixing unrelated changes.

## Before Coding
- Sync main branch: `git pull origin main` (or `develop` if that is the base).
- Create branch from the correct base: `git checkout -b feature/auth-refresh`.

## During Work
- Keep commits small and scoped; follow `type(scope): description`.
- Commit frequently with clear messages (see code-style commit convention).
- Rebase onto base branch to keep history clean; resolve conflicts locally.

## Before Push
1) Run relevant tests (`pnpm test`, targeted filters, integration where applicable).
2) Check formatting and linting if configured.
3) Ensure docs/specs updated for any API or schema change.
4) Confirm no secret files (.env) are staged.

## Push and PR
- Push branch: `git push origin <branch>`.
- Open PR with:
  - Summary of change and context.
  - Risk and impact (API/DB/security).
  - Tests run (commands and results).
  - Migration notes if present.
- Request review aligned with approval level (Level 2 or 3 for risky changes).
