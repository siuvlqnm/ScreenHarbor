# ScreenHarbor Web

Svelte Telegram Mini App shell for browsing media, selecting watch status, viewing resources, and submitting resources for review.

## Local Development

```bash
npm run dev --workspace @screenharbor/web
```

Telegram's WebApp SDK is loaded in `index.html`. Outside Telegram, the app falls back to local preview mode.

## API Configuration

Create `apps/web/.env` when the Workers API is running locally:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

If the API is not configured or unavailable, the app keeps using bundled sample data.
