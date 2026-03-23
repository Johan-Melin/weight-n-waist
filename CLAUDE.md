@AGENTS.md

# Project: next-neon-starter

Template for tracker apps. Stack: Next.js 16 (App Router), Neon PostgreSQL, Auth.js v5, Tailwind CSS 4, TypeScript.

## Key conventions

### Auth
- Auth is handled by Auth.js v5 (`auth.ts` at project root).
- Use `getUser()` from `lib/dal.ts` in Server Components to get the current user. It redirects to `/login` if not authenticated and is memoized per request.
- Authenticated pages live inside `app/(dashboard)/` which has a layout that enforces auth.
- Unauthenticated pages (`/login`, `/signup`) live inside `app/(auth)/`.
- Server Actions for auth are in `app/actions/auth.ts`.

### Database
- DB client: `sql` from `lib/db.ts` (Neon serverless tagged-template queries).
- Schema source of truth: `db/schema.sql`. Extend it when adding new tables.
- All queries run server-side only (Server Components or Server Actions).

### Environment variables
- Validated at startup via `lib/env.ts` (Zod). Add new vars there when needed.
- Copy `.env.example` to `.env.local` and fill in values for a new project.

### File structure
```
app/
  (auth)/       # login, signup — no auth required
  (dashboard)/  # protected pages — auth enforced by layout
  actions/      # Server Actions
  api/          # Route handlers
lib/
  db.ts         # Neon SQL client
  dal.ts        # Data Access Layer (getUser)
  env.ts        # Validated env vars
db/
  schema.sql    # Full DB schema
```

### Adding a new feature
1. Add table(s) to `db/schema.sql` and run against Neon.
2. Add page(s) under `app/(dashboard)/` for protected UI.
3. Add Server Actions under `app/actions/` for mutations.
4. Query the DB directly in Server Components using `sql` from `lib/db.ts`.

## Known gotchas

### Route conflicts with `app/page.tsx`
`app/page.tsx` and `app/(dashboard)/page.tsx` both resolve to `/` — Next.js will throw a build error if both exist. Protected pages must live at a sub-path (e.g. `app/(dashboard)/tracker/page.tsx` → `/tracker`). Keep `app/page.tsx` as a thin redirect: redirect authenticated users to the app, show login/signup links otherwise.

### Auth.js v5 does not forward `user.id` into the session automatically
The `id` returned from `authorize()` is stored as `token.sub` in the JWT, but `session.user.id` is **not** populated unless you wire it up explicitly. Always add these callbacks to `auth.ts`:
```ts
callbacks: {
  jwt({ token, user }) {
    if (user?.id) token.sub = user.id;
    return token;
  },
  session({ session, token }) {
    if (token.sub) session.user.id = token.sub;
    return session;
  },
},
```
Without this, any insert that uses `user.id` from `getUser()` will fail with a not-null constraint violation.

### `searchParams` and `params` are Promises in Next.js 16
Page props must be awaited before use:
```ts
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; page?: string }>
}) {
  const { year, page } = await searchParams;
}
```

### Neon `sql` results are untyped — cast explicitly
The tagged-template `sql` function returns `any[]`. Cast results at the call site:
```ts
const rows = (await sql`SELECT ...`) as Array<{ id: string; name: string }>;
```

### Conditional WHERE clauses require separate query branches
The Neon `sql` tag does not support interpolating raw SQL fragments safely. For optional filters, write separate queries:
```ts
if (yearFilter) {
  rows = await sql`SELECT ... WHERE user_id = ${id} AND EXTRACT(YEAR FROM date) = ${yearFilter}`;
} else {
  rows = await sql`SELECT ... WHERE user_id = ${id}`;
}
```

### Linting
Use `npm run lint`, not `npx next lint` (the latter misinterprets the command in some shells).
