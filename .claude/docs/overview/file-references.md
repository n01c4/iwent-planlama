# File References

## Files to Read by Task Type
| Task Type | Files to Read |
|-----------|---------------|
| General Context | `iwent-summary.txt`, `iWent_Backend_PRD.md` |
| API Development | `iwent_openapi_v2.yaml`, `openapi_v3_additions.yaml` |
| Database Change | `iwent_database_schema_v2.sql` |
| New Feature | `iWent_Technical_Roadmap.md`, related `.txt` feature files |
| Organizer Features | `organizer-dashboard.txt` |
| User Features | `homepage.txt`, `profile.txt`, `friends.txt`, `chats.txt` |
| Settings | `settings.txt` |
| Philosophy and UX | `clickablility-and-modular-database.txt` |
| Search Features | `side-features.txt` |

## Frontend Feature Files
```
iwent-planlama/
|- chats.txt                    # Chat features
|- friends.txt                  # Friendship system
|- homepage.txt                 # Homepage (discovery, search)
|- profile.txt                  # User profile
|- settings.txt                 # Settings
|- organizer-dashboard.txt      # Organizer features
|- side-features.txt            # Natural language search and related ideas
|- clickablility-and-modular-database.txt  # Clickability philosophy
```

## Technical Documents
```
iwent-planlama/
|- iWent_Backend_PRD.md         # Comprehensive Backend PRD
|- iwent_database_schema_v2.sql # Database schema (v3 updates included)
|- iwent_openapi_v2.yaml        # Current API spec
|- openapi_v3_additions.yaml    # v3 new endpoints
|- iWent_Technical_Roadmap.md   # Implementation roadmap
|- iwent-summary.txt            # Product vision
```

## Expected Project Structure (Backend)
```
iwent-backend/
|- prisma/
|  |- schema.prisma             # Database schema (Prisma)
|- src/
|  |- modules/                  # Feature modules
|  |  |- auth/
|  |  |  |- auth.controller.ts
|  |  |  |- auth.service.ts
|  |  |  |- auth.schema.ts
|  |  |  |- auth.test.ts
|  |  |- users/
|  |  |- events/
|  |  |- tickets/
|  |  |- orders/
|  |  |- social/
|  |  |  |- friends/
|  |  |  |- stories/
|  |  |  |- chat/
|  |  |- venues/
|  |  |- artists/
|  |  |- org/
|  |     |- events/
|  |     |- team/
|  |     |- analytics/
|  |     |- moderation/
|  |- shared/                   # Shared utilities
|  |  |- middleware/            # Auth, rate limiting, error handling
|  |  |- validators/            # Zod schemas
|  |  |- errors/                # Custom error classes
|  |  |- utils/                 # Utility functions
|  |  |- types/                 # Shared types
|  |- config/                   # Configuration
|  |- app.ts                    # Application entry
|- tests/                       # Test files
|  |- unit/
|  |- integration/
|  |- fixtures/
|- docs/                        # Documentation
|- scripts/                     # Utility scripts
```
