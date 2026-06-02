# ScreenHarbor API

Cloudflare Workers service for Telegram auth, media data, user tracking, reviews, resources, moderation, points, and Telegraph mappings.

## Local Development

```bash
npm run dev --workspace @screenharbor/api
```

## Routes

- `GET /health`
- `POST /auth/telegram`
- `GET /media`
- `GET /media/:id`
- `GET /media/:id/status`
- `POST /media/:id/status`
- `GET /media/:id/reviews`
- `POST /media/:id/reviews`
- `GET /media/:id/resources`
- `POST /media/:id/resources`
- `GET /resources/latest`
- `POST /reports`
- `GET /admin/resources/pending`
- `POST /admin/resources/:id/moderate`

The API reads from D1 when bindings and migrations are available. It falls back to demo responses during early local development.

User-specific routes read `X-Telegram-Init-Data`. During local development without Telegram init data, they use the seeded `demo-contributor` account.
