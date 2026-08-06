# Security baseline

## Required controls for the MVP

- Use Supabase Auth for sessions and short-lived access tokens; the current Expo client persists its session through SQLite-backed local storage and runs one foreground refresh lifecycle.
- Enable RLS on every exposed table. Start from deny-by-default and add policies for the membership and ownership paths in [PERMISSIONS.md](PERMISSIONS.md).
- Keep secret/service-role keys and all provider/hardware credentials server-side. The mobile app receives only a Supabase publishable key.
- Validate every mutation with Zod (or equivalent server-side validation) and enforce database constraints for IDs, states, timestamps, and uniqueness.
- Use signed, expiring storage URLs for private lesson files and submissions. Do not expose buckets as public merely to simplify downloads.
- Make offline writes idempotent and reject stale or replayed attendance/hardware events.
- Record privileged actions, role changes, attendance corrections, moderation actions, and integration failures in an append-only audit stream.
- Minimize student data in notifications, analytics, logs, and social adapters. Never log tokens, keys, raw attendance payloads, or assignment contents unnecessarily.
- Keep phone-activity summaries on-device. Usage Access must be student-initiated, revocable, and never repurposed for staff monitoring, grading, attendance, advertising, or hidden background collection.
- Apply rate limits and abuse controls to sign-in, quiz submission, social posting, and hardware ingestion paths.
- Treat external Sairam/social integrations as untrusted input. Use allowlisted adapters, timeout/retry limits, schema validation, and a kill switch per provider.
- Treat Google's hosted-domain (`hd`) parameter as an account-picker hint only. The app verifies the returned email and the `handle_new_user` database trigger rejects every domain except `sairamtap.edu.in`.
- Keep Google sign-in separate from Workspace data access. The MVP requests identity only and launches official Workspace pages; it does not store Drive, Classroom, SAIL, SkillRack, or HackerRank credentials.

## Mobile release hygiene

Before a release, verify that production builds contain no `.env` files, test credentials, debug logging, or development endpoints. Configure Android network security, backup behavior, and notification permissions intentionally in the Expo/EAS configuration when those features are added.

## Security verification

Every new table or mutation requires:

1. A migration with constraints and RLS enabled.
2. Positive and negative policy tests for each role and ownership boundary.
3. A review of offline replay, export, deletion, and notification behavior.
4. An update to the role matrix and threat model if access scope changes.

The three migrations enable RLS, repair role escalation and scoped access, enforce the Sairam identity boundary, expose institution-wide calendar rows safely, and remove anonymous table access. Live authenticated policy-matrix testing is still required after deployment to the intended LearnFlow project.
