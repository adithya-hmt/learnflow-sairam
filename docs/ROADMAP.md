# Roadmap

## Phase 0 — foundation (implemented locally)

- Expo SDK 57 Router app, design system, five-tab navigation, demo role workspaces, and environment contract.
- Supabase client lifecycle, roles/RLS migration, seed data, SQLite outbox, and social/hardware adapter contracts.
- Strict type checking and domain boundary tests.

## Phase 1 — Section D connected pilot (implemented and deployed)

- Supabase email/Google authentication, profile-driven student access, typed repositories, timetable and attendance summaries, learning/progress flows, notifications, and the native QR confirmation bridge are implemented.
- SQLite assignment drafts replay when connectivity returns; unsupported, invalid, or cross-account mutations fail closed into local quarantine.
- The forward pilot migrations and idempotent Section D seed are deployed to the configured Supabase project; local and remote student-pilot RLS smoke tests pass.
- The standalone arm64 Android 1.2.0 APK is built, signed with the existing pilot debug certificate, installed, and smoke-tested with the persisted student session. Fresh interactive sign-in, offline rendering behind the device lock screen, and mutation screens that require real faculty assignments/lessons/notifications remain device follow-ups.
- Remote push delivery, quizzes, social interaction, staff/mentor workspaces, and the full six-role product matrix remain deferred.

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
