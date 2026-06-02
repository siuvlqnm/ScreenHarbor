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
- `GET /resources/latest`

The API reads from D1 when bindings and migrations are available. It falls back to demo responses during early local development.
