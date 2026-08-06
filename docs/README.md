# LearnFlow documentation

LearnFlow is an Android-first learning platform MVP for Sri Sairam Engineering College. The repository contains a polished Expo Router app in [`apps/mobile`](../apps/mobile/), Sairam Google authentication, official Google Workspace and college-portal handoffs, a durable SQLite draft/outbox layer, role and integration boundaries, and an executable Supabase schema with RLS in [`supabase`](../supabase/). It runs with demo data until the intended LearnFlow Supabase project is configured.

## Start here

- [Local setup and environment](SETUP.md)
- [Architecture and data schema](ARCHITECTURE.md)
- [Roles and permissions](PERMISSIONS.md)
- [Security baseline](SECURITY.md)
- [Testing and verification](TESTING.md)
- [Delivery roadmap](ROADMAP.md)

The status labels in these documents are intentional:

- **Implemented** describes behavior visible in the current checkout.
- **Ready to connect** describes implemented client/schema boundaries that still need a deployed Supabase project.
- **Roadmap** describes work after the MVP.

Do not treat the schema as deployed until the migration has been applied to the intended Supabase project and live role-matrix tests have passed.
