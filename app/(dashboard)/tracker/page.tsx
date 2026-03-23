import { getUser } from "@/lib/dal";
import { sql } from "@/lib/db";
import Link from "next/link";
import { AddMeasurementForm } from "../_components/AddMeasurementForm";
import {
  MeasurementsChart,
  type ChartMeasurement,
} from "../_components/MeasurementsChart";
import { EntryRow } from "../_components/EntryRow";
import { ImportForm } from "../_components/ImportForm";

type Measurement = {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
};

type UnitSystem = "metric" | "imperial";

const PER_PAGE = 20;

function parseDay(s: string) {
  return new Date(s + "T00:00:00");
}

function toDisplay(
  value: number | null,
  factor: number,
  unit: UnitSystem
): string {
  if (value == null) return "–";
  if (unit === "imperial") return (value * factor).toFixed(1);
  return value.toString();
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; page?: string }>;
}) {
  const user = await getUser();
  const { year, page: pageStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const offset = (page - 1) * PER_PAGE;
  const yearNum = year ? parseInt(year) : null;

  // User preference
  const prefRows = (await sql`
    SELECT unit_system FROM users WHERE id = ${user.id} LIMIT 1
  `) as Array<{ unit_system: string }>;
  const unitSystem = (prefRows[0]?.unit_system ?? "metric") as UnitSystem;

  const weightUnit = unitSystem === "imperial" ? "lbs" : "kg";
  const waistUnit = unitSystem === "imperial" ? "in" : "cm";

  // Available years for filter
  const yearRows = (await sql`
    SELECT DISTINCT EXTRACT(YEAR FROM measured_at)::INT AS year
    FROM measurements
    WHERE user_id = ${user.id}
    ORDER BY year DESC
  `) as Array<{ year: number }>;
  const years = yearRows.map((r) => r.year);

  // Paginated entries (conditionally filtered by year)
  let entries: Measurement[];
  let totalCount: number;

  if (yearNum) {
    const rows = (await sql`
      SELECT id, measured_at::TEXT, weight_kg::FLOAT, waist_cm::FLOAT
      FROM measurements
      WHERE user_id = ${user.id}
        AND EXTRACT(YEAR FROM measured_at) = ${yearNum}
      ORDER BY measured_at DESC, created_at DESC
      LIMIT ${PER_PAGE} OFFSET ${offset}
    `) as Measurement[];
    const countRows = (await sql`
      SELECT COUNT(*)::INT AS count
      FROM measurements
      WHERE user_id = ${user.id}
        AND EXTRACT(YEAR FROM measured_at) = ${yearNum}
    `) as Array<{ count: number }>;
    entries = rows;
    totalCount = countRows[0]?.count ?? 0;
  } else {
    const rows = (await sql`
      SELECT id, measured_at::TEXT, weight_kg::FLOAT, waist_cm::FLOAT
      FROM measurements
      WHERE user_id = ${user.id}
      ORDER BY measured_at DESC, created_at DESC
      LIMIT ${PER_PAGE} OFFSET ${offset}
    `) as Measurement[];
    const countRows = (await sql`
      SELECT COUNT(*)::INT AS count
      FROM measurements
      WHERE user_id = ${user.id}
    `) as Array<{ count: number }>;
    entries = rows;
    totalCount = countRows[0]?.count ?? 0;
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  // All measurements for chart
  const allMeasurements = (await sql`
    SELECT id, measured_at::TEXT, weight_kg::FLOAT, waist_cm::FLOAT
    FROM measurements
    WHERE user_id = ${user.id}
    ORDER BY measured_at ASC
  `) as ChartMeasurement[];

  // Latest recorded values
  const latestWeight = [...allMeasurements]
    .reverse()
    .find((m) => m.weight_kg != null);
  const latestWaist = [...allMeasurements]
    .reverse()
    .find((m) => m.waist_cm != null);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold tracking-tight">
        Weight &amp; Waist Tracker
      </h1>

      {/* Latest stats */}
      {(latestWeight || latestWaist) && (
        <div className="grid grid-cols-2 gap-4">
          {latestWeight && (
            <div className="border rounded-xl p-4">
              <p className="text-xs opacity-50 mb-1">Latest Weight</p>
              <p className="text-3xl font-bold tabular-nums">
                {toDisplay(latestWeight.weight_kg, 2.20462, unitSystem)}
                <span className="text-base font-normal opacity-50 ml-1">
                  {weightUnit}
                </span>
              </p>
              <p className="text-xs opacity-40 mt-1">
                {parseDay(latestWeight.measured_at).toLocaleDateString()}
              </p>
            </div>
          )}
          {latestWaist && (
            <div className="border rounded-xl p-4">
              <p className="text-xs opacity-50 mb-1">Latest Waist</p>
              <p className="text-3xl font-bold tabular-nums">
                {toDisplay(latestWaist.waist_cm, 0.393701, unitSystem)}
                <span className="text-base font-normal opacity-50 ml-1">
                  {waistUnit}
                </span>
              </p>
              <p className="text-xs opacity-40 mt-1">
                {parseDay(latestWaist.measured_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Add Entry</h2>
        <AddMeasurementForm unitSystem={unitSystem} />
      </section>

      {/* Chart */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Chart</h2>
        <MeasurementsChart measurements={allMeasurements} unitSystem={unitSystem} />
      </section>

      {/* Entries table */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold">Entries</h2>
          <a
            href="/api/export"
            className="text-xs px-2.5 py-1 border rounded-md font-medium border-current/20 hover:border-current/50 transition-colors"
          >
            Export CSV
          </a>
          <ImportForm />
          {years.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Link
                href="/tracker"
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                  !year
                    ? "bg-foreground text-background border-transparent"
                    : "border-current/20 hover:border-current/50"
                }`}
              >
                All
              </Link>
              {years.map((y) => (
                <Link
                  key={y}
                  href={`/tracker?year=${y}`}
                  className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                    year === String(y)
                      ? "bg-foreground text-background border-transparent"
                      : "border-current/20 hover:border-current/50"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm opacity-50">No entries found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-6 font-medium opacity-60">
                      Date
                    </th>
                    <th className="text-left py-2 pr-6 font-medium opacity-60">
                      Weight ({weightUnit})
                    </th>
                    <th className="text-left py-2 pr-6 font-medium opacity-60">
                      Waist ({waistUnit})
                    </th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      unitSystem={unitSystem}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-sm">
                <span className="opacity-50">
                  {totalCount} entries · page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/tracker?${new URLSearchParams({
                        ...(year ? { year } : {}),
                        page: String(page - 1),
                      })}`}
                      className="px-3 py-1.5 border rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      ← Prev
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/tracker?${new URLSearchParams({
                        ...(year ? { year } : {}),
                        page: String(page + 1),
                      })}`}
                      className="px-3 py-1.5 border rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
