# KL University — CRT Feedback (React + Tailwind frontend)

Separate React frontend for the CRT Student Feedback System, built with **Vite + React 18 + Tailwind CSS v4**, designed for **Vercel** hosting.

## Pages

| Route | What it is |
|-------|-----------|
| `/` | Student feedback form (KL University branding, mobile-friendly) |
| `/admin` | Admin login → table-first analysis report with heat-colored tables |

## The KL logo

Save your KL University logo image as:

```
frontend-react/public/kl-logo.png
```

Every page (form header, admin report, browser tab icon) picks it up automatically. Until the file exists, a styled "KL" monogram is shown instead.

## Admin passcode (server-verified)

The passcode is checked by the **backend** (`POST /api/admin/login`), and every admin
endpoint (`/api/responses`, `/api/analytics`, `/api/export/excel`) requires it —
they return **401 Unauthorized** without it. The student endpoints
(`/api/config`, `/api/feedback`) stay public so the form works.

To change the passcode: edit `ADMIN_PASSCODE` in `/var/www/crt/backend/.env`
on the VPS, then run `pm2 restart crt-feedback --update-env`.

## Connecting to the backend

The app calls the backend at the **same origin** (`/api/...`). On Vercel, `vercel.json` proxies those calls to your backend server:

```json
{ "source": "/api/(.*)", "destination": "http://YOUR_BACKEND_IP/api/$1" }
```

**Edit `vercel.json` and put your real backend address** (currently set to `http://187.127.135.148`). This proxy also solves HTTPS→HTTP mixed-content blocking, because Vercel forwards the request server-side.

## Deploy to Vercel

```
npm i -g vercel
cd frontend-react
vercel --prod
```

or push this folder to GitHub and import the repo in vercel.com (framework preset: **Vite**; build command `npm run build`; output `dist`).

## Local development

```
# terminal 1 — backend with local JSON storage
cd backend
set STORAGE=json&& set PORT=3001&& node server.js

# terminal 2 — frontend (proxies /api to :3001)
cd frontend-react
npm run dev
```

## Report contents (all tables, heat colored: red = low/difficult → green = strong)

1. KPI row — responses, branches, positive %, negative %, weakness count
2. Overall summary — every parameter with average + interpretation
3. Branch-wise heat table — every question × every branch
4. Weak topics — students who rated a topic ≤ 4, with % heat
5. **Sentiment analysis** — per feedback question: positive / neutral / negative counts, %, distribution bar; branch-wise sentiment per question; top keywords
6. Strengths & weaknesses — overall and branch-wise
7. Responses table with branch filter and heat-colored ratings
8. Print / PDF button (A4 print styles) + Excel download (from backend)
