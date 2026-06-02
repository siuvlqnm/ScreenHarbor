# Project Change Log

## 2026-06-02

### API data wiring

- Connected the web shell to the Workers API through `VITE_API_BASE_URL`, with bundled sample data as a fallback.
- Added D1-backed media list, media detail, and latest resource API queries.
- Added a demo seed migration for local D1 development.
- Documented API configuration and the new `/resources/latest` route.

### Initial scaffold

- Initialized the ScreenHarbor monorepo structure.
- Added `apps/web` with a Svelte, TypeScript, and Vite Telegram Mini App shell.
- Added `apps/api` with a Cloudflare Workers API shell, Telegram initData verification entry point, demo media routes, D1 binding, and R2 binding.
- Added `packages/shared` for shared media, watch status, resource type, and visibility types.
- Added the initial D1 schema migration for users, media items, tags, credits, watch statuses, reviews, comments, resource posts, point ledger, reports, moderation logs, and Telegraph pages.
- Added local development documentation, environment examples, and root workspace scripts.
- Verified the project with `npm run check` and `npm run build`.
