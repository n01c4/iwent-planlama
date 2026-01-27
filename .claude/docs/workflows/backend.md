# Backend Development Workflow

## Technical Stack
*   **Framework**: Fastify + TypeScript
*   **Database**: PostgreSQL (Supabase)
*   **ORM**: Prisma
*   **Auth**: JWT (Stateless)
*   **Real-time**: Supabase Realtime

## Project Structure
```
iwent-backend/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── modules/                # Feature-based modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── events/
│   │   └── ...
│   ├── shared/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── errors/
│   ├── config/
│   └── app.ts
```

## Key Workflows

### 1. Adding a New Feature
1.  **Read PRD**: Check `iWent_Backend_PRD.md` and feature-specific text files.
2.  **Design API**: Update `iwent_openapi_v2.yaml` or create `openapi_v3_additions.yaml`.
3.  **Database**: If needed, update `schema.prisma` and create a migration (see `db-migration.md`).
4.  **Implementation**:
    *   Create Module: `src/modules/<feature>/`
    *   Controller -> Service -> Repository pattern.
    *   Add Zod validation schemas.
5.  **Testing**: Write Unit and Integration tests.

### 2. Modifying Existing Logic
1.  **Understand**: Read existing code and tests.
2.  **Refactor**: Make changes while keeping existing tests passing.
3.  **Verify**: Add new tests for changed logic.

## Do Not Do
*   **No Admin Endpoints**: Admin panel is Post-MVP.
*   **No New User Types**: Only User, Organizer, Admin.
*   **No Raw SQL**: Use Prisma or approved raw query builders for complex cases.
