# Social account OAuth (Phase 10 placeholders)

Community Connect stores linked profiles in `UserSocialLink`. Phase 10 uses **manual URL entry** via `POST /api/users/me/social-links/connect` for demos.

## Planned OAuth providers

| Platform | Provider key | Status |
|----------|--------------|--------|
| Facebook | `facebook` | Stub — `GET /api/auth/oauth/facebook` returns 501 |
| Instagram | `instagram` | Stub (Meta Business) |
| TikTok | `tiktok` | Stub |
| X (Twitter) | `twitter` | Stub |
| LinkedIn | `linkedin` | Stub |
| YouTube | `google` (YouTube scope) | Optional |

## Manual connect (current)

```json
POST /api/users/me/social-links/connect
{
  "platform": "INSTAGRAM",
  "profileUrl": "https://instagram.com/alex_r",
  "username": "alex_r",
  "isPublic": true
}
```

## Production checklist

1. Register OAuth apps per provider; store secrets in env.
2. Implement callback routes under `/api/auth/oauth/[provider]/callback`.
3. Exchange code for tokens; map to `profileUrl` / `username`.
4. Replace manual connect UI with "Connect with …" buttons that redirect to OAuth.
5. Refresh tokens and handle revocation on disconnect.
