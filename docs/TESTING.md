# Testing and verification

## Current checks

The MVP includes Jest domain-boundary tests. Run the local gate from the repository root:

```bash
npm run verify
npm --workspace @learnflow/mobile run export
```

The type check covers the Router tree and strict TypeScript sources. Jest locks role capabilities, adapter validation, SQLite queue/cache behavior, and account ownership of queued drafts. All checked-in timestamped SQL migrations, the seed, and `supabase/tests/rls_smoke.sql` are executed with `ON_ERROR_STOP` against disposable PostgreSQL during release verification. The RLS smoke test blocks role escalation, grade/quiz tampering, unpublished lessons, fake course events, and club access to academic assignments. A physical device or emulator is still required for interactive Android verification; remote push, quizzes, social interaction, staff/mentor workspaces, EDUMATE, NFC/BLE, and kiosk flows are deferred.

## MVP test layers

Extend tests in this order as live integrations land:

1. **Pure domain tests** — permission predicates, Zod schemas, sync conflict rules, progress calculations, and adapter normalization. Keep these fast and deterministic.
2. **Repository tests** — Supabase request mapping, RLS-facing queries, SQLite migrations, queue retries, and idempotency. Use a disposable Supabase project or local Supabase instance; never use production data.
3. **Component tests** — loading, empty, error, offline, accessibility-label, and optimistic-update states for each feature.
4. **Device smoke tests** — sign in, open an enrolled lesson, submit a draft, reconnect and sync, receive a notification, and sign out on Android.
5. **Security tests** — execute the role matrix against RLS with each role, including cross-course, cross-department, and unauthenticated requests.

## Pull request gate

Run the smallest relevant checks locally, then the full gate in CI:

```bash
cd apps/mobile
npm exec -- tsc --noEmit
npm test -- --runInBand
```

CI should also run dependency audit policy, live migration/RLS tests, and an Android smoke suite before production release.
