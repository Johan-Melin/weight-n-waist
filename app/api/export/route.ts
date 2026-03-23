import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const prefRows = (await sql`
    SELECT unit_system FROM users WHERE id = ${userId} LIMIT 1
  `) as Array<{ unit_system: string }>;
  const unitSystem = prefRows[0]?.unit_system ?? "metric";
  const isImperial = unitSystem === "imperial";

  const rows = (await sql`
    SELECT measured_at::TEXT, weight_kg::FLOAT, waist_cm::FLOAT
    FROM measurements
    WHERE user_id = ${userId}
    ORDER BY measured_at ASC, created_at ASC
  `) as Array<{ measured_at: string; weight_kg: number | null; waist_cm: number | null }>;

  const weightHeader = isImperial ? "weight_lbs" : "weight_kg";
  const waistHeader = isImperial ? "waist_in" : "waist_cm";

  const lines = [
    `date,${weightHeader},${waistHeader}`,
    ...rows.map((r) => {
      const weight =
        r.weight_kg == null
          ? ""
          : isImperial
          ? (r.weight_kg * 2.20462).toFixed(2)
          : r.weight_kg.toFixed(2);
      const waist =
        r.waist_cm == null
          ? ""
          : isImperial
          ? (r.waist_cm * 0.393701).toFixed(2)
          : r.waist_cm.toFixed(2);
      return `${r.measured_at},${weight},${waist}`;
    }),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="measurements.csv"`,
    },
  });
}
