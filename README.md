# Airdrop Hunter — Admin Dashboard

> Private single-owner admin console for the [Airdrop Hunter backend](../server).
> Live discovery, AI research, risk scoring, wallet tracking, and P&L — all from your browser.

---

## Overview

This is the **admin frontend** for a personal Airdrop Hunter system. It connects to a local
Express 5 + MongoDB + Redis backend that discovers public airdrop opportunities, collects evidence,
runs AI research, scores risk/opportunity, and tracks earnings.

- **Single-owner auth** — JWT + refresh token rotation, optional TOTP 2FA
- **Dark gradient UI** — built with Tailwind, `.card` design system
- **Real-time data** — auto-refresh dashboards, live queue status
- **Responsive** — mobile drawer, tablet/desktop sidebar
- **12 admin pages** — one for every backend module

> **No secrets live in this frontend.** API keys, database URLs, and bot tokens stay in
> `../server/.env`. This app only holds a JWT and a backend URL.

---

## Features

### Dashboard (`/`)
- Live summary: total projects, active opportunities, high-risk count, tasks due
- Financial tiles: earned / spent / realized P&L
- 12-month earnings line chart (Recharts)
- Source health snapshot (healthy / failing)

### Airdrops (`/airdrops`)
- Searchable, filterable, paginated project table
- Filter by status and campaign type
- One-click bookmark toggle
- Add-project modal
- Drill-down to full detail

### Airdrop Detail (`/airdrops/:id`)
- 5 tabs: **Overview · Evidence · Research · Risk · Score**
- Run AI research directly from the header
- Inline status change (audited on the server)
- Score breakdown bars, risk findings with evidence URLs

### Sources (`/sources`)
- Add RSS / GitHub / Website / Reddit sources
- Enable / disable / delete
- Trigger a fetch on demand (shows `itemsFound` / `itemsNew`)
- Last success + failure count per source

### Tasks (`/tasks`)
- Create tasks (social, testnet, on-chain, referral, KYC, snapshot, claim, research, other)
- Optional project + deadline + URL
- Inline participation state updates

### Wallets (`/wallets`)
- **Watch-only** — public addresses only, no private keys ever
- Multi-chain: Ethereum, Base, BNB, Arbitrum, Optimism, Polygon, Solana
- Server validates addresses via `ethers` / `@solana/web3.js`

### Claims (`/claims`)
- Claim status per wallet per project
- Filter by status

### Earnings & P&L (`/earnings`)
- Record earnings (token received / sale proceeds / estimated)
- Record expenses (gas / bridge / fee / other)
- Live realized P&L
- **Auto-dedup**: sale_proceeds supersedes token_received for the same symbol

### Listings (`/listings`)
- Track announced / verified / live exchange listings
- Evidence URL required
- **Live price capture** via CoinGecko / Binance (`Get price` inline)

### Analytics (`/analytics`)
- Discovery trend (30-day line chart)
- Status breakdown (bar)
- Risk distribution (pie)
- Chain distribution (bar)
- Per-project profitability table

### Notifications (`/notifications`)
- Live feed (auto-refresh every 30s)
- Mark one / mark all read
- **Full prefs editor**: quiet hours, channels, thresholds

### Settings (`/settings`)
- Runtime scoring weight editor (7 weights)
- Live sum validation (should total 1.0)
- Env-managed variables **read-only guide** — no secret editing in UI

### System (`/system`)
- MongoDB / Redis / Telegram health
- RPC configuration per chain
- Live queue counts (waiting / active / completed / failed / delayed)
- Uptime

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router 6 |
| Data fetching | TanStack React Query 5 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Styling | Tailwind CSS 3 |
| HTTP | Native `fetch` with auto-refresh wrapper |
| Auth | JWT (Bearer) + refresh-token rotation |

No Redux, no CSS-in-JS, no heavy abstraction. Everything is small, composable, and readable.

---

## Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 22 |
| Backend | [Airdrop Hunter server](../server) running on `http://localhost:3000` |

Verify the backend is up:

```bash
curl http://localhost:3000/readyz
```

You should see `{ "success": true, "data": { "db": "up", "redis": "up" } }`.

### Install

```bash
cd airdrop-dashboard
npm install
```

### Configure

Create `.env`:

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
```

> **Never put secrets here.** Vite bundles `VITE_*` values into the client. This file must
> only contain the public backend URL.

### Update backend CORS

Edit `../server/.env` and add the dashboard origin:

```dotenv
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Restart the backend:

```bash
cd ../server
npm start
```

### Run

```bash
npm run dev
```

Open **http://localhost:5173**.

### First login

Use the **owner** email and password that you created with:

```bash
cd ../server
npm run bootstrap-owner
```

If 2FA is enabled on the owner, a second field appears after the first attempt.

---

## Project Structure

```
airdrop-dashboard/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.jsx              # React entry, QueryClient
│   ├── App.jsx               # Routes + providers
│   ├── index.css             # Tailwind + .card design system
│   ├── lib/
│   │   ├── api.js            # fetch wrapper + auto-refresh
│   │   └── format.js         # fmtUSD / fmtDate / fmtRelative
│   ├── context/
│   │   └── AuthContext.jsx   # login/logout + user state
│   ├── components/
│   │   ├── Layout.jsx        # Sidebar + topbar shell
│   │   ├── ProtectedRoute.jsx
│   │   ├── UI.jsx            # Button/Input/Select/Modal/Confirm/Spinner
│   │   ├── Toast.jsx         # success/error toasts
│   │   └── Pagination.jsx
│   └── pages/
│       ├── Login.jsx
│       ├── Dashboard.jsx
│       ├── Airdrops.jsx
│       ├── AirdropDetail.jsx
│       ├── Sources.jsx
│       ├── Tasks.jsx
│       ├── Wallets.jsx
│       ├── Claims.jsx
│       ├── Earnings.jsx
│       ├── Listings.jsx
│       ├── Analytics.jsx
│       ├── Notifications.jsx
│       ├── Settings.jsx
│       └── System.jsx
```

---

## Auth Flow

```
┌────────────┐      POST /auth/login       ┌────────────┐
│   Login    │ ─────────────────────────▶  │  Backend   │
│   Page     │                              │            │
└─────┬──────┘  ◀─── accessToken, refresh ──└─────┬──────┘
      │                                            │
      │  save tokens to localStorage               │
      ▼                                            │
┌─────────────────────────────────┐                │
│ AuthContext.authed = true       │                │
│ All API calls include Bearer    │                │
└────────────────┬────────────────┘                │
                 │                                 │
                 │ On 401                          │
                 ▼                                 │
        POST /auth/refresh ────────────────────────┘
        ├── OK    → retry original request
        └── 401   → clearTokens + redirect /login
```

- Access token lives **15 minutes** (`JWT_ACCESS_TTL` server-side)
- Refresh token lives **30 days** and **rotates** on every refresh
- **Reuse detection**: presenting a revoked refresh token revokes the whole family
  (server-side), forcing a re-login

### Storage keys

| Key | Purpose |
|---|---|
| `ah_at` | access token |
| `ah_rt` | refresh token |
| `ah_user` | cached user object (for UI) |

All in `localStorage`. **Never stored server-side as cookies** (this is a single-owner app;
token-based auth is simpler and works across domains for the Vercel deploy).

---

## API Integration

Every backend module is wired. **Base URL** comes from `VITE_API_URL`.

| Page | Endpoint(s) |
|---|---|
| Dashboard | `GET /dashboard`, `GET /analytics/source-health` |
| Airdrops | `GET /airdrops`, `POST /airdrops`, `PATCH /airdrops/:id/bookmark` |
| Airdrop Detail | `GET /airdrops/:id`, `PATCH /airdrops/:id/status`, `POST /research/:id/run` |
| Sources | `GET /sources`, `POST /sources`, `PATCH /sources/:id`, `POST /sources/:id/fetch`, `DELETE /sources/:id` |
| Tasks | `GET /tasks`, `POST /tasks`, `PUT /tasks/:id/participation` |
| Wallets | `GET /wallets`, `POST /wallets`, `DELETE /wallets/:id` |
| Claims | `GET /claims`, `POST /claims` |
| Earnings | `GET /earnings`, `POST /earnings`, `POST /earnings/expenses` |
| Listings | `GET /listings`, `POST /listings`, `POST /listings/price/capture` |
| Analytics | `GET /analytics/*` (10 endpoints) |
| Notifications | `GET /notifications`, `PUT /notifications/prefs`, `POST /notifications/:id/read`, `POST /notifications/read-all` |
| Settings | `GET /settings/:key`, `PUT /settings/:key` |
| System | `GET /system/health`, `GET /system/queues` |

The API wrapper (`src/lib/api.js`) handles:

- Attaching `Authorization: Bearer <accessToken>`
- Auto-refresh on 401 (retry once)
- Consistent error extraction (`error.message`, `error.code`, `error.details`)
- Redirecting to `/login` if refresh fails

---

## Design System

All components use CSS classes defined in `src/index.css`:

```css
.card {
  @apply rounded-lg border border-white/10 bg-[#0B1220] p-3 shadow-xl;
}
.card-hover {
  @apply transition-colors hover:border-white/20 hover:bg-[#0d1525];
}
.btn-primary { @apply btn bg-emerald-500 text-black hover:bg-emerald-400; }
.btn-secondary { @apply btn border border-white/10 bg-white/5 text-white hover:bg-white/10; }
.badge-green { @apply badge border-emerald-500/30 bg-emerald-500/10 text-emerald-400; }
/* ...and red/yellow/blue/purple/gray */
```

### Palette

| Role | Hex |
|---|---|
| Background | `#000` with radial emerald + indigo glows |
| Card | `#0B1220` |
| Border | `rgba(255,255,255,0.1)` |
| Accent | `#10b981` (emerald) |
| Text primary | `#fff` |
| Text secondary | `#9ca3af` |

### Adding a new card

```jsx
<div className="card p-4">
  <h3 className="text-sm font-medium text-white">Title</h3>
  <p className="text-sm text-gray-400">Body</p>
</div>
```

### Adding a new page

1. Create `src/pages/MyPage.jsx`
2. Add route in `src/App.jsx`
3. Add nav item in `src/components/Layout.jsx` `NAV` array
4. Use `.card`, `.btn`, `.input`, `.badge` classes for consistency

---

## Scripts

```bash
npm run dev        # start dev server (port 5173)
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

---

## Deployment (Vercel)

### Option A — One-click via Vercel CLI

```bash
cd airdrop-dashboard
npm i -g vercel
vercel
```

Set environment variable in the Vercel dashboard:

```
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

### Option B — Git integration

1. Push repo to GitHub
2. Vercel → **Add New → Project**
3. Select the repo, set **Root Directory** = `airdrop-dashboard`
4. Framework Preset = **Vite**
5. Build Command = `npm run build`
6. Output Directory = `dist`
7. Environment: add `VITE_API_URL`

### Post-deploy — backend CORS

Edit your backend `.env`:

```dotenv
CORS_ORIGINS=https://your-app.vercel.app
```

Restart the backend.

### Critical

- **Never** put backend secrets in Vercel environment variables
- **Never** put `OPENAI_API_KEY`, `MONGODB_URI`, `TELEGRAM_BOT_TOKEN`, or `JWT_ACCESS_SECRET` in
  the frontend — they will be exposed to every visitor's browser
- Only `VITE_API_URL` belongs here

---

## 🩺 Troubleshooting

### "Failed to fetch" on login

**Cause:** Backend not running or CORS rejects.

**Fix:**
```bash
# check backend
curl http://localhost:3000/readyz
# check CORS origin matches exactly
cat ../server/.env | grep CORS_ORIGINS
```

CORS must include the exact origin (`http://localhost:5173`, **no trailing slash**).

### "Session expired" loop

**Cause:** `JWT_ACCESS_SECRET` was rotated on the server while the browser held an old token.

**Fix:** Log out and log back in. If it persists, clear `localStorage` in DevTools → Application →
Local Storage → delete `ah_at`, `ah_rt`, `ah_user`.

### Charts are empty

**Cause:** No data in the corresponding collection.

**Fix:** Trigger some discovery (`/sources` → fetch), record an earning (`/earnings`),
or run a scoring pass. Charts fill automatically within 60 seconds.

### Login says `TOTP_REQUIRED`

**Fix:** Enter the 6-digit code from your authenticator app. The second field appears
automatically after the first login attempt.

### Blank page after deploy

**Cause:** SPA fallback missing. Vercel with the Vite preset handles this via `vercel.json`
auto-generation. If you're on a custom host, add:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

### "Invalid URL" or connection refused

**Cause:** `VITE_API_URL` points to the wrong host.

**Fix:**
```bash
# during dev
echo $VITE_API_URL   # or: type .env

# during deploy — check Vercel env vars
vercel env ls
```

Rebuild after changing `.env` (`npm run dev` restarts, but `npm run build` needs a rebuild).

---

## Security Checklist

Before going live:

- [ ] `VITE_API_URL` uses `https://` (not `http://`) — prevents MITM
- [ ] `CORS_ORIGINS` on backend is the **exact** Vercel URL, no wildcards
- [ ] `JWT_ACCESS_SECRET` rotated from any dev value
- [ ] Backend owner password is strong and rotated
- [ ] No `OPENAI_API_KEY` / `GEMINI_API_KEY` / `MONGODB_URI` in Vercel env vars
- [ ] Browser DevTools → check Network tab: no secrets in request bodies
- [ ] `localStorage` is not accessible via XSS — sanitize any user-provided strings (this app does not
  render `dangerouslySetInnerHTML`; project names and URLs are React-escaped by default)

---

## What's Not Here (By Design)

This admin console **does not**:

- Sign or broadcast transactions — watch-only by design
- Store wallet private keys or seed phrases — the server rejects them too
- Approve token allowances — never automated
- Perform KYC or social actions — you do those manually
- Show tokens/prices that don't have evidence URLs — the backend enforces this

---

## 🗺 Roadmap (Optional)

- [ ] Global search bar in topbar (Cmd+K)
- [ ] Notification bell with unread count
- [ ] User dropdown menu (currently a simple Logout button)
- [ ] Export buttons (JSON / CSV) wired to `GET /system/export`
- [ ] Import modal wired to `POST /system/import`
- [ ] 2FA enrollment flow (begin → QR → confirm)
- [ ] Project merge UI (`POST /airdrops/:id/merge`)
- [ ] Analytics date range picker
- [ ] Dark/light theme toggle (currently dark only)

---

## License

Private. **Not for public distribution.** Personal single-owner use only.

---

## Credits

- Backend: Airdrop Hunter Node.js service (Express 5 + MongoDB + Redis + BullMQ)
- Icons: [Lucide](https://lucide.dev)
- Charts: [Recharts](https://recharts.org)