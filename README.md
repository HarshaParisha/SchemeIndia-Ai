# SchemeIndia AI

SchemeIndia AI is a government scheme discovery platform for India that helps people quickly find Central and State schemes they may qualify for — with clear benefits, eligibility hints, documents, steps, and official links.

## Why this exists
Millions of people miss benefits because information is scattered across portals, hard to search, and written in complex language. SchemeIndia AI brings schemes into one clean experience and helps users shortlist what matters.

## Key features

### Discovery
- Browse schemes by category, state/UT, and keywords.
- Scheme pages include benefit summary, eligibility blocks, required documents checklist, application steps, and official links.
- “Tips to apply” section for quick, practical guidance.

### Scheme Finder (matching)
- A 5-step questionnaire to help users find relevant schemes.
- Results are split into Central vs State schemes.

### Sahyogi (chat assistant)
- Bottom-right chat widget on the home page.
- Starts with a greeting and quick actions.
- Asks multiple-choice questions (no free-form personal data collection).
- Shows eligible schemes with benefits and an eligibility grid.
- If no match is found, it suggests relevant schemes to explore for the selected state.

### SEO + PWA
- SEO-friendly metadata, sitemap, and robots.
- Works as a PWA with offline fallback support.
- Installable on Android; can be added to Home Screen on iOS.

## Tech stack
- Frontend: React + TypeScript + Vite + Tailwind
- PWA: `vite-plugin-pwa` (Workbox)
- Optional data layer: Supabase (public read table + seeding script)

## Repository structure
- `client/`: frontend app
- `server/`: backend services + Supabase seeding script
- `supabase/`: migrations for Supabase schema

## Local setup

### 1) Frontend
```bash
cd client
npm install
npm run dev
```

Optional env (`client/.env`):
- `VITE_API_URL` (if using backend APIs)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 2) Backend (optional)
```bash
cd server
npm install
npm run dev
```

### 3) Seed Supabase schemes (optional)
```bash
cd server
npm run seed:supabase:schemes
```

Required env (do **not** commit):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Production

### Build
```bash
cd client
npm run build
```

### Deploy
- Recommended: Vercel for the frontend.
- Make sure your `VITE_SUPABASE_*` values are set in Vercel environment variables if you use Supabase.

## Disclaimer
Scheme details may change. Always verify eligibility and deadlines on the official government portal before applying.

## Author
Harsha
- Website: https://harshaparisha.in/
- Instagram: https://www.instagram.com/harsha._.l4
- LinkedIn: https://www.linkedin.com/in/parisha-harshavardhan/
- GitHub: https://github.com/HarshaParisha

