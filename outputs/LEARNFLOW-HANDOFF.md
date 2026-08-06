# LearnFlow Android handoff

## Install

Use `learnflow-sairam-workspace-2026-08-06-arm64.apk` on a 64-bit Android device. It is a standalone build and does not require Expo Go or a development server.

For phone activity, open **Campus → Phone activity → Allow usage access**, then enable LearnFlow in Android Usage Access settings. The permission remains off until the student grants it.

SHA-256: `cdc4e25e046f01b85a82e65926ba507cc303de6756a4bc821334e34c8c9b217b`

## Included

- Clean Sairam Google-first login with an email/password fallback for existing `@sairamtap.edu.in` accounts.
- Gmail, Calendar, Drive, Classroom, Meet, Docs, Sheets, HackerRank, SkillRack, SAIL, Obsidian, and Super Productivity launchpad using official destinations and no third-party password storage.
- Semester V CSE timetable, attendance, syllabus-aligned course seed, and curated 2026–27 odd-semester academic milestones.
- Home, Learn, Campus, Calendar, Attendance, social feed, assignments, quizzes, progress, offline SQLite cache/outbox, and role-aware workspaces.
- On-device Android usage summaries. LearnFlow does not upload app-usage history.

## Enable live Supabase and Google authentication

The Supabase connection currently exposed to Codex is not the LearnFlow database, so no remote schema was overwritten. Select or reconnect the intended LearnFlow Supabase project, then apply:

1. `supabase/migrations/001_learnflow.sql`
2. `supabase/migrations/002_product_hardening.sql`
3. `supabase/migrations/003_sairam_workspace.sql`
4. `supabase/seed.sql`

Configure the Supabase Google provider with a Sairam-approved Web OAuth client and add `learnflow://**` to the Supabase redirect allow list. Put only the project URL and publishable key in `apps/mobile/.env`; keep the Google client secret in Supabase.

## Verification

- TypeScript passed.
- Jest passed: 9 suites, 31 tests.
- All migrations, seed data, and the RLS smoke test passed on disposable PostgreSQL 16.
- Expo SDK 57 public configuration resolved with the `learnflow` scheme and Expo WebBrowser module.
- Android arm64 release build and lint passed for target SDK 36.
- APK v2 signature verification passed; the unused Expo development client and overlay permission were removed.
- The final APK installed successfully on the connected Pixel 7 Pro. It was not launched because the phone was in an active call.
