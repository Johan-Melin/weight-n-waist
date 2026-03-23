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

### Server Actions called from Client Components
To call a server action from a client component (e.g. a delete button), import it directly and call inside `useTransition`:
```tsx
"use client";
import { useTransition } from "react";
import { deleteThing } from "@/app/actions/things";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button disabled={isPending} onClick={() => startTransition(() => deleteThing(id))}>
      Delete
    </button>
  );
}
```

### Year/page filter navigation in Client Components
URL-based filters (year, page) work best as `<Link>` components in Server Components. If you need a `<select>` dropdown for the same purpose, make it a small Client Component using `useRouter`:
```tsx
"use client";
import { useRouter } from "next/navigation";
export function YearSelect({ years, current }: { years: number[]; current?: string }) {
  const router = useRouter();
  return (
    <select value={current ?? ""} onChange={(e) => router.push(e.target.value ? `/?year=${e.target.value}` : "/")}>
      <option value="">All</option>
      {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
    </select>
  );
}
```

### File downloads (CSV export)
Use a Route Handler (`app/api/*/route.ts`) returning a `Response` with `Content-Disposition: attachment`. Server Actions cannot trigger file downloads.
```ts
return new Response(csvString, {
  headers: {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename="export.csv"`,
  },
});
```
Link to it with a plain `<a href="/api/export">` — no JS needed.

### User preferences (per-user settings)
Store user preferences (e.g. unit system) as a column on the `users` table with a DEFAULT. Fetch it alongside other data in Server Components; update via a Server Action + `revalidatePath`. For optimistic UI in Client Components, mirror the server value in `useState` and update it locally before the action resolves.

## Styling conventions

### Design system
- Page background (`bg-background`): slightly grey — `#f1f1f3` light / `#0c0c0e` dark.
- Card surface (`bg-surface`): white / `#18181b` dark. Defined as `--surface` CSS variable in `globals.css` and exposed via `@theme inline` as `--color-surface`.
- Cards use `bg-surface rounded-2xl p-4`. No border — the background contrast against the page provides separation.
- Subtle separators: `border-black/[0.06] dark:border-white/[0.04]` instead of plain `border`.
- Interactive idle states: `bg-black/[0.04] dark:bg-white/[0.06]` fill instead of borders.

### Padding
Use `p-4` for cards. `p-6` is too large and wastes space, especially on mobile.

### Measurement color coding
Weight is always **blue** (`text-blue-500`, `bg-blue-500`, stroke `#3b82f6`).
Waist is always **orange** (`text-orange-500`, `bg-orange-500`, stroke `#f97316`).
Apply consistently: stat cards, form labels, table column headers and values, chart lines and legend.

### Flex rows that can overflow
Any `flex` row containing inputs or many items must use `flex-wrap` or be split into multiple rows. A single unwrapped row of date inputs + buttons will overflow the card on narrow screens. Prefer splitting controls into logical rows (e.g. presets on row 1, date range on row 2) over relying on wrapping alone.

### Inputs filling available width
Inside a flex row, date/number inputs need `flex-1 min-w-0` to grow and not overflow their container. Without `min-w-0`, flex children can exceed their parent's width.

### Vercel deployment cache
When reusing a Vercel project name after deletion, edge nodes may serve stale responses for up to an hour. Force resolution by triggering a fresh redeployment from the Vercel dashboard (Deployments → Redeploy), which invalidates the CDN cache across all edge locations.
