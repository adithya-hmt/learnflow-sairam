# Task 2 report

Implemented the student-pilot repository and offline mutation slice.

- Files changed: `apps/mobile/src/data/index.ts`, `apps/mobile/src/lib/offline.ts`, `apps/mobile/src/lib/sync.ts`.
- Repository: enrolled-only course reads, submission-derived assignment status, timetable and attendance-summary mapping, draft save/restore, online-only final submission, lesson-progress upsert/queue, and notification read mutation.
- Offline: account-scoped SQLite submission drafts and outbox mutations; unsupported or cross-account mutations remain quarantined/unsynced.
- Review fixes: caller-selected draft ownership removed; student assignments are explicitly filtered to active enrollment course IDs; unsupported, invalid, and cross-account outbox records are quarantined with reasons; demo sync reports actual local pending count; focused repository/sync tests cover mappings, scoping, account-bound drafts, final-submit auth errors, and demo pending state.
- Tests: `npm run typecheck` passed; `npm test -- --runInBand` passed (12 suites, 43 tests); `git diff --check` passed.
- Commits: `47b59970634db5f42b52374561fef01b2b27bcc2` (implementation), `51dad42` (initial report), `d500d96bfd055c578f84d24da9073e23b1e2f982` (review fixes and final evidence).

Risks: browser/device integration and live Supabase RLS were not run here; those require configured credentials and a running native environment.
