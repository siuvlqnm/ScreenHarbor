# ScreenHarbor

幕屿，运行在 Telegram 内的影视资料、观影追踪和用户资源投稿 Mini App。

## Project Shape

- `apps/web`: Svelte + TypeScript + Vite Telegram Mini App.
- `apps/api`: Cloudflare Workers API, D1 binding, R2 binding.
- `packages/shared`: Shared domain types and enums.
- `apps/api/migrations`: D1 schema migrations.

## Quick Start

Install dependencies:

```bash
npm install
```

Start the Mini App:

```bash
npm run dev:web
```

Start the Workers API:

```bash
npm run dev:api
```

Run type checks:

```bash
npm run check
```

## Cloudflare Setup

Create a D1 database and update `apps/api/wrangler.toml` with the real database id:

```bash
npx wrangler d1 create screenharbor
```

Apply the initial schema:

```bash
npx wrangler d1 migrations apply screenharbor --local
```

Set the Telegram bot token for production verification:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

## MVP Scope

The first milestone focuses on the smallest complete loop:

- Telegram Mini App entry and user identity verification.
- Media list, search, filters, and detail page.
- Watch status, rating, and short review.
- Resource submission, visibility control, review workflow, reports, and invalid markers.
- Telegraph long-form content links.
