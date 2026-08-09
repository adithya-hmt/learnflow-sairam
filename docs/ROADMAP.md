# Roadmap

## Phase 0 — foundation (implemented locally)

- Expo SDK 57 Router app, design system, five-tab navigation, demo role workspaces, and environment contract.
- Supabase client lifecycle, roles/RLS migration, seed data, SQLite outbox, and social/hardware adapter contracts.
- Strict type checking and domain boundary tests.

## Phase 1 — connected pilot (implemented locally; deployment pending)

- Supabase email authentication, profile-driven roles, typed repositories, learning/video/progress flows, notifications, attendance summaries, and the native QR confirmation bridge are implemented locally.
- SQLite assignment drafts replay when connectivity returns; unsupported, invalid, or cross-account mutations fail closed into local quarantine.
- Apply the pending timestamped pilot migration and idempotent seed to the intended Supabase project, then run Android smoke tests. Remote push delivery, quizzes, social interaction, and staff/mentor workspaces remain deferred.
- Run Android device smoke tests and the student-pilot RLS matrix before the college pilot; the full six-role product matrix remains later work.

## Phase 2 — campus collaboration (deferred)

- Mentor views and scoped notes.
- Club coordinator tools and a moderated Sairam social feed.
- Adapter-based ingestion for approved social providers with per-provider kill switches and audit events.
- Department dashboards and export controls.

## Phase 3 — hardware and operations (deferred)

- NFC attendance and any automated attendance adapter beyond the approved native QR confirmation bridge.
- Classroom display and kiosk modes with restricted sessions.
- BLE and lab hardware adapters behind a versioned capability contract.
- Device fleet health, calibration, observability, and incident runbooks.

## Release rule

Do not call a phase complete because screens exist. A phase is complete only when its data model, RLS policies, offline behavior (where applicable), accessibility states, tests, and Android smoke path are verified. Keep vendor-specific hardware and social integrations behind adapters so a provider can be disabled without changing academic records.
