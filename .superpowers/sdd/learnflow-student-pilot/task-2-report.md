# Task 2 report

Implemented the student-pilot repository and offline mutation slice.

- Files changed: `apps/mobile/src/data/index.ts`, `apps/mobile/src/lib/offline.ts`, `apps/mobile/src/lib/sync.ts`.
- Repository: enrolled-only course reads, submission-derived assignment status, timetable and attendance-summary mapping, draft save/restore, online-only final submission, lesson-progress upsert/queue, and notification read mutation.
- Offline: account-scoped SQLite submission drafts and outbox mutations; unsupported or cross-account mutations remain quarantined/unsynced.
- Review fixes: retryable Supabase/network/server failures now remain pending while deterministic cross-account/unsupported/structurally-invalid records are quarantined; draft restoration derives the current profile account; focused tests cover active-id scoping, all assignment statuses, connected draft/save and current-account restore paths.
- Tests: `npm run typecheck` passed; `npm test -- --runInBand` passed (12 suites, 50 tests), including demo/connected lesson-progress fallback, final-submit error preservation, deterministic quarantine, valid completion, and transient retry retention; `git diff --check` passed.
- Commits: `47b59970634db5f42b52374561fef01b2b27bcc2` (implementation), `51dad42` (initial report), `d500d96bfd055c578f84d24da9073e23b1e2f982` (review fixes and final evidence).

Risks: browser/device integration and live Supabase RLS were not run here; those require configured credentials and a running native environment.
