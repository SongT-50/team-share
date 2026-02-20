# Deployment Specification — team-share

> **Project**: team-share
> **Level**: Dynamic
> **Date**: 2026-02-20

---

## 1. Deployment Architecture

```
                    User Browser
                        │
                        ▼
              ┌─────────────────┐
              │     Vercel       │  ← Next.js 15 (Frontend)
              │  (CDN + Edge)   │
              └────────┬────────┘
                       │ HTTPS
                       ▼
              ┌─────────────────┐
              │   bkend.ai      │  ← BaaS (Backend)
              │  - Auth          │
              │  - Collections   │
              │  - File Storage  │
              └─────────────────┘
```

## 2. Environment Variables

| Variable | Description | Where |
|----------|-------------|-------|
| `NEXT_PUBLIC_BKEND_API_KEY` | bkend.ai API Key | Vercel Environment Variables |
| `NEXT_PUBLIC_BKEND_PROJECT_ID` | bkend.ai Project ID | Vercel Environment Variables |

## 3. bkend.ai Collections

| Collection | Purpose |
|------------|---------|
| `users` | User accounts |
| `teams` | Team data |
| `chat-messages` | Chat messages |
| `shared-files` | File metadata |
| `action-items` | Action items (todo/decision/idea) |
| `notifications` | Notification records |

## 4. Deployment Steps

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Configure bkend.ai project (collections, auth)
5. Deploy via Vercel auto-deploy
6. Verify all routes and features

## 5. Vercel Configuration

- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto)
- **Node.js Version**: 20.x
- **Install Command**: `npm install`
