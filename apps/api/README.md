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

The first implementation includes demo media responses so the web app can be built before D1 seed data exists.
