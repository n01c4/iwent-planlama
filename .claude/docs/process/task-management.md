# Task Management

## Breakdown Strategy
Phase 1: Analysis (read-only)
1. Read related files.
2. Understand current implementation.
3. Identify dependencies.
4. Detect potential issues.

Phase 2: Planning
1. Break work into subtasks.
2. For each subtask capture description, affected files, dependencies, and complexity (simple/medium/complex).
3. Order subtasks; define critical path.

Phase 3: Approval
1. Share plan with the user.
2. Gather feedback and adjust.
3. Obtain required approval level before execution.

Phase 4: Execution
1. Execute subtasks in order.
2. Report progress after each major step.
3. Stop and ask if blocked.
4. Write and run tests before calling a change done.

## TodoWrite Usage
- Use TodoWrite for tasks with 2 or more steps, complex features, and non-trivial bug fixes.
- Example list:
```
1. [ ] Examine current implementation
2. [ ] Prepare database migration script
3. [ ] Update Prisma schema
4. [ ] Repository layer
5. [ ] Service layer
6. [ ] Controller/route handler
7. [ ] Validation schema
8. [ ] Unit tests
9. [ ] Integration tests
10. [ ] Documentation update
```

## Progress Reporting
- After major steps, report status with completed/current/remaining counts.
- Example:
```
Completed: prisma schema, repository
Current: service layer
Remaining: validation, tests, docs (3 steps)
Progress: 5/8
```

## Intermediate Approval for Long Tasks
- For long-running work, send an interim status every 3–4 steps:
```
INTERIM STATUS
Completed: <list>
In progress: <list>
Pending: <list>
Issues: <yes/no + detail>
Continue?
```
