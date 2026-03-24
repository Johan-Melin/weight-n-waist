# Weight & Waist

A simple tracker for logging weight and waist measurements over time.

**Live:** [weight-n-waist.vercel.app](https://weight-n-waist.vercel.app)

**Stack:** Next.js 16 (App Router) · Neon PostgreSQL · Auth.js v5 · Tailwind CSS 4 · TypeScript

## Features

- Log weight (kg/lbs) and waist (cm/in) measurements by date
- Chart visualizing trends over time
- Stat cards showing your latest weight and waist readings
- Filter entries by year, paginated table of all entries
- Export data as CSV, import from CSV
- Metric and imperial unit support per user
- Email/password authentication

## Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Neon

Create a new project at [neon.tech](https://neon.tech) and copy the connection string.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
DATABASE_URL=       # from Neon dashboard
AUTH_SECRET=        # run: npx auth secret
```

### 4. Run the database schema

```bash
psql $DATABASE_URL -f db/schema.sql
```

### 5. Start the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign up at `/signup`, sign in at `/login`.
