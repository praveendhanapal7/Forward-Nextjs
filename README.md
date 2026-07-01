# FORWARD Agency — Lead Management Portal

A full-stack Next.js application for **Forward Agency** to manage client leads, track campaign status, and provide branded client portals.

## What It Does

- **Client Portal** — clients view their brand's leads and campaign updates
- **Staff Portal** — staff add and manage lead enquiries for assigned brands
- **Agency View** — agency users see all leads across every brand with filters and analytics
- **Lead CRM** — full status workflow (New → Attended → Interested → Won/Lost) with audit logs, notes, and WhatsApp/call actions

## Tech Stack

| Layer         | Tec                                                |
| ------------- | -------------------------------------------------- |
| Framework     | Next.js 16 (App Router)                            |
| Database      | PostgreSQL via Prisma ORM                          |
| Auth          | Cookie-based sessions (HttpOnly, 7-day TTL)        |
| Rate limiting | Upstash Redis (graceful fallback when unavailable) |
| Validation    | Zod schemas                                        |
| Charts        | Recharts                                           |
| Icons         | Lucide React                                       |
| Font          | Plus Jakarta Sans (via next/font)                  |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env` to `.env.local` and fill in:

```env
DATABASE_URL=postgresql://...
SECRET_KEY_HMAC_SECRET=your-hmac-secret
UPSTASH_REDIS_REST_URL=https://...    # optional — app works without it
UPSTASH_REDIS_REST_TOKEN=...          # optional
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Seed demo data

```bash
npm run db:seed
```

This creates 9 brands, 10 demo users, and 100+ lead entries.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Account Types

| Role     | Access                                 |
| -------- | -------------------------------------- |
| `client` | View their own brand's leads only      |
| `staff`  | Add leads for their assigned brand     |
| `agency` | See all brands, add leads to any brand |

## Lead Status Workflow

`NEW` → `ATTENDED` → `INTERESTED` / `NO_RESPONSE` / `CALL_BACK` → `FOLLOW_UP` → `WON` / `LOST`

Every status change is timestamped and appended to an immutable audit log per lead.

## Project Structure

```
app/
  (public)/        Public pages (home, blog, contact, signin, signup)
  dashboard/       Protected CRM portal with sidebar layout
  api/             Route handlers (auth, leads, notes, brands, contact)
lib/               Prisma client, auth utils, validation, rate limiting
components/        Header, Footer, auth guards, dashboard sidebar/topbar
styles/            CSS modules per section
prisma/            Schema, migrations, seed script
```

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
npm run db:seed    # Seed database with demo data
```
