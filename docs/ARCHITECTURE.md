# Architecture and data schema

## Current implementation

The checkout is a small npm-workspace monorepo:

```text
apps/mobile/app/       # Expo Router screens
apps/mobile/src/       # design system, state, Supabase, SQLite, adapters
supabase/migrations/   # relational schema and RLS
supabase/seed.sql      # credential-safe sample records
docs/                  # operator and product documentation
```

The app uses TanStack Query for server-state orchestration, Zustand for small UI state, Zod at adapter and queue boundaries, React Hook Form for assignment drafts, and SQLite for durable cache/outbox records. The Supabase client is optional so demo mode never needs secrets.

## MVP shape

Keep the first release as a modular Expo app backed by Supabase. Add modules inside `apps/mobile/src/` rather than splitting into services:

```text
src/
  app/          # Expo Router routes and providers
  features/     # auth, courses, assignments, social, attendance, progress
  components/   # shared UI and design tokens
  data/         # Supabase client, repositories, sync queue
  db/           # expo-sqlite schema and migrations
  lib/          # validation, permissions, adapters
```

Use TanStack Query for server state, Zustand for small client/UI state, React Hook Form plus Zod at input boundaries, and SQLite only for explicitly offline-capable records. Keep domain operations behind repositories so an adapter or local cache can be tested without rendering screens.

## Relational schema

The executable source of truth is `supabase/migrations/001_learnflow.sql` plus `002_product_hardening.sql`. Deploying both to a specific Supabase project remains an operator action.

| Table | Purpose | Key relationships |
| --- | --- | --- |
| `profiles` | User identity and department metadata | `auth.users.id` |
| `courses` | Course catalog and ownership | `departments`, `profiles` |
| `enrollments` | Student course enrollment | `courses`, `profiles` |
| `lessons` | Ordered course content | `courses` |
| `lesson_progress` | Student completion and video position | `lessons`, `profiles` |
| `assignments` | Work submitted by students | `courses`, `profiles` |
| `submissions` | Student assignment attempts and grading | `assignments`, `profiles` |
| `quizzes` / `quiz_questions` / `quiz_attempts` | Assessments and attempts | `courses`, `profiles` |
| `calendar_events` | Deadlines, classes, and campus events | `courses`, `profiles` |
| `attendance_records` | Attendance capture and corrections | `courses`, `profiles` |
| `achievements` | Earned milestones | `profiles` |
| `mentor_assignments` | Explicit mentor-to-student scope | `profiles` |
| `clubs` | Coordinator and department scope | `profiles` |
| `notifications` | User-scoped notifications | `profiles` |
| `download_items` | Download metadata and expiry | `profiles`, content IDs |
| `social_posts` / `social_reactions` | Normalized Sairam feed data | Adapter source IDs |
| `sync_changes` | Server-side synchronization audit | `profiles` |
| `integration_events` | Hardware and external adapter audit trail | Source and actor IDs |
| `audit_log` | Privileged role-change evidence | Actor and entity IDs |

Every user-owned row needs an `owner_id` or a membership path that can be checked in RLS. Store adapter payloads as validated JSON only where fields are genuinely provider-specific; keep authorization fields in typed columns.

## Offline boundary

Repository reads cache account-scoped courses, lessons, calendar events, social posts, attendance, achievements, and progress in SQLite and fall back to those records on network failure. Assignment drafts enter an actor-bound outbox and replay only for the same signed-in account. Unsupported or cross-account mutations fail closed and stay queued. The server remains authoritative for grades, role changes, quiz scores, and attendance corrections.

## Hardware boundary

`apps/mobile/src/lib/integrations.ts` defines and validates normalized NFC/QR, classroom display, kiosk, BLE, and lab signals. Vendor SDK implementations, signed device enrollment, replay protection, and physical calibration remain roadmap work.
