# Task 3 report — Student pilot UI

## Changes

- Connected calendar reads profile-scoped timetable slots and calendar events while retaining device-clock/current-period messaging.
- Connected attendance reads published summaries with source timestamps; local QR receipts remain visibly separate and no attendance row is created by the QR flow.
- Lesson completion, assignment drafts/final submission, and notification read state use repository methods and query invalidation. Assignment final submit is explicit, confirmed, and online-only.
- Added an app-wide, unmistakable no-backend demo banner; removed push-enable and no-op social filters; connected attendance submission uses only the signed-in profile SCC ID.
- Corrected roadmap, architecture, and testing claims and bumped Android/app version to 1.2.0 / versionCode 5.

## Verification

- `npm run typecheck` — passed.
- `npm test -- --runInBand` — 12 suites / 50 tests passed.
- `npm run export` — Android Expo export passed.
- `git diff --check` — passed.

## Gaps

Physical Android smoke testing and live Supabase/RLS verification were not run in this worktree. Quizzes, social interaction, staff/mentor workspaces, remote push delivery, EDUMATE integration, NFC/BLE, and kiosk modes remain deferred.

## Commit

`9378571ded12ab9162c3ca7f58f5d07d9686d555` (implementation commit)

## Review follow-up

- Added SQL-time parsing/current-next boundary tests, profile-scoped timetable QR windows, actor-scoped local receipts with isolation tests, explicit overall attendance handling, full weekly timetable rendering, honest connected achievements empty state, assignment invalidation, visible notification failures, and package-lock version metadata.
- Corrected permissions scope, migration ordering, active-outbox quarantine wording, and deferred capability claims.
- Preserved demo QR schedule fallback while requiring authenticated profile/session actors for connected scans and receipt updates.
- Added a tested bridge guard that blocks demo/signed-out native attendance launch, gates demo navigation, and labels demo progress as sample data.
- Follow-up verification: `npm run typecheck`, `npm test -- --runInBand` (13 suites / 53 tests), `npm run export`, and `git diff --check` all passed.
