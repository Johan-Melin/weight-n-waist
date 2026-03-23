import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/tracker");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>Not signed in.</p>
      <div className="flex gap-4 text-sm">
        <Link href="/login" className="underline">Sign in</Link>
        <Link href="/signup" className="underline">Sign up</Link>
      </div>
    </main>
  );
}
