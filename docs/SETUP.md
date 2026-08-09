# Local setup

## Prerequisites

- Node.js 22.13 or newer (Node.js 26.2.0 was used to verify this checkout).
- npm 10 or newer (npm 11.13.0 was used to verify this checkout).
- Android Studio and an Android emulator or USB-debuggable device for native Android runs.
- An Expo-compatible development environment.

## Run the app

```bash
npm install
cp .env.example apps/mobile/.env
npm run start
```

The app uses safe demo data when environment variables are absent. Use the Expo CLI prompts or run:

```bash
npm run android
npm run web
```

## Android build with phone activity

Phone activity uses Android's native Usage Access API and therefore does not run inside Expo Go. Build and install LearnFlow's development app instead:

```bash
cd apps/mobile
npx expo run:android
```

Open **Campus → Phone activity → Open Usage Access**, enable LearnFlow, and return to the app. The permission is off by default and can be revoked in Android Settings at any time.

`npm run ios` is available in `package.json`, but it requires macOS and an iOS simulator. Android is the supported first target.

## Verification

Run the type check before opening a pull request:

```bash
npm run verify
```

Inspect the resolved Expo configuration when changing `app.json`:

```bash
npx expo config --type public
```

## Environment variables

Use an ignored local file such as `apps/mobile/.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
```

Only the Supabase project URL and publishable key may be exposed to the mobile bundle. Secret/service-role keys, database passwords, OAuth client secrets, signing keys, webhook secrets, and hardware credentials belong server-side and must never use the `EXPO_PUBLIC_` prefix. Apply the migrations in `supabase/migrations/` in filename order, then `supabase/seed.sql` in the intended LearnFlow project.

With these values present, LearnFlow requires Supabase authentication and protects the tab routes. Without them, it stays in the documented demo mode.

## Sairam Google sign-in

1. In the Google Cloud project approved for Sairam Workspace, create a **Web application** OAuth client.
2. Add the Supabase callback URL shown under **Authentication → Providers → Google** as an authorized redirect URI in Google Cloud.
3. Enable the Google provider in Supabase and enter the client ID and client secret there. Never place the secret in the Expo environment file.
4. In **Authentication → URL Configuration**, add `learnflow://**` to the redirect allow list.
5. If Workspace blocks the client, a Sairam Google Workspace administrator must allow it.

The app sends Google an `hd=sairamtap.edu.in` account hint, then enforces the domain again in the mobile session and in the database user-creation trigger. Email/password remains a fallback only for existing Sairam accounts.

## Workspace and college portals

The Connections screen opens Gmail, Calendar, Drive, Classroom, Meet, Docs, Sheets, HackerRank, SkillRack, and SAIL at their official destinations. These are credential-free handoffs, not simulated API sync. Direct Drive or Classroom sync should be added only after Sairam approves an OAuth client and the exact scopes; use the narrowest scopes (`drive.file` and student-scoped Classroom read access) rather than broad Workspace access.
