# Frontend Development Workflow

## Applications

| Application | User Type | Folder | Status |
|-------------|-----------|--------|--------|
| **Welcome Screen** | End Users | `iwent-welcome-screen/` | MVP ✅ |
| **Organizer Panel** | Organizers | `iwent-organizatör-paneli/` | MVP ✅ |
| **Admin Panel** | Admins | `iwent-admin-panel/` | Post-MVP ❌ |

## Feature Reference Files
Before starting any frontend task, read the specific requirement file:

*   **Chat/Social**: `chats.txt`
*   **Friends**: `friends.txt`
*   **Discovery/Home**: `homepage.txt`
*   **Profile**: `profile.txt`
*   **Settings**: `settings.txt`
*   **Organizer Dashboard**: `organizer-dashboard.txt`
*   **Search**: `side-features.txt`
*   **UX Philosophy**: `clickablility-and-modular-database.txt`

## Development Rules

1.  **Do Not Break Backend**: If you need API changes, coordinate with backend first.
2.  **Mock First**: Use mock data in `services/mockData.ts` (or similar) before integrating real APIs.
3.  **Type Safety**: Share types with backend or generate them from OpenAPI spec (`iwent_openapi_v2.yaml`).
4.  **Components**: Reuse UI components from `components/` folder. Do not duplicate styles.

## Integration Process

1.  **Check Contract**: Verify the API endpoint in `iwent_openapi_v2.yaml`.
2.  **Generate Client**: Use a tool or manual types to match the API response.
3.  **Handle States**: Implement `loading`, `error`, and `success` states for all async calls.
4.  **Error Handling**: Display user-friendly error messages, not raw API errors.
