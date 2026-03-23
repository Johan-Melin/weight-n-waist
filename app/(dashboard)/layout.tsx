import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";
import { NavDropdown } from "./_components/NavDropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;
  const rows = (await sql`
    SELECT unit_system FROM users WHERE id = ${userId} LIMIT 1
  `) as Array<{ unit_system: string }>;
  const unitSystem = (rows[0]?.unit_system ?? "metric") as
    | "metric"
    | "imperial";

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/tracker" className="font-semibold">
          Weight &amp; Waist
        </Link>
        <NavDropdown
          userName={session.user.name ?? "Account"}
          unitSystem={unitSystem}
        />
      </nav>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
