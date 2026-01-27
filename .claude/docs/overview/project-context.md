# Project Context

- Project: iWent Backend API
- Vision: mobile event ticketing that builds real social connections before and after events.
- Align every decision with the product philosophy and values below.

## What is iWent
iWent is a mobile event ticketing platform that turns event participation into social interaction. The product focuses on meaningful connections, balanced digital use, and community-first events.

## Philosophy
"Don't stare at the screen, even if it's iWent" — collect moments, meaning, and friends.

Principles:
- Direct users back to the real world.
- Enable meaningful connections, not endless scrolling.
- Avoid digital addiction; keep attention healthy.
- Support collective, community-centered experiences.

## Core Values
| Value | Description |
|-------|-------------|
| Meaningful Connections | Real friendships instead of superficial social media. |
| Digital Balance | Healthy digital life, not platform addiction. |
| Discoverability | Everything is clickable; democratic access to information. |
| Collective Experience | Community-focused events over individual usage. |

## File to Read First
- Always read `iwent-summary.txt` before any work. It contains product vision, philosophy, main features, and the problems we solve. Keep decisions aligned with it.

## User Types
| Type | Description | MVP |
|------|-------------|-----|
| User | End users (participants). | Yes |
| Organizer | Event organizers. | Yes |
| Admin | Platform administrators. | Post-MVP |

Rules:
- Only these three user types exist; do not add more.
- Do not add sub-types or roles beyond RBAC needs.

## Frontend Applications
| Frontend | User | MVP |
|----------|------|-----|
| `iwent-welcome-screen` | Users | Yes |
| `iwent-organizator-paneli` | Organizers | Yes |
| `iwent-admin-panel` | Admins | Post-MVP |

Keep backend changes compatible with the MVP frontends. Avoid breaking changes unless coordinated with the relevant frontend.
