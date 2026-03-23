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

function toDisplay(value: number | null, factor: number, unit: UnitSystem) {
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

  const prefRows = (await sql`
    SELECT unit_system FROM users WHERE id = ${user.id} LIMIT 1
  `) as Array<{ unit_system: string }>;
  const unitSystem = (prefRows[0]?.unit_system ?? "metric") as UnitSystem;

  const weightUnit = unitSystem === "imperial" ? "lbs" : "kg";
  const waistUnit = unitSystem === "imperial" ? "in" : "cm";

  const yearRows = (await sql`
    SELECT DISTINCT EXTRACT(YEAR FROM measured_at)::INT AS year
    FROM measurements
    WHERE user_id = ${user.id}
    ORDER BY year DESC
  `) as Array<{ year: number }>;
  const years = yearRows.map((r) => r.year);

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

  const allMeasurements = (await sql`
    SELECT id, measured_at::TEXT, weight_kg::FLOAT, waist_cm::FLOAT
    FROM measurements
    WHERE user_id = ${user.id}
    ORDER BY measured_at ASC
  `) as ChartMeasurement[];

  const latestWeight = [...allMeasurements].reverse().find((m) => m.weight_kg != null);
  const latestWaist = [...allMeasurements].reverse().find((m) => m.waist_cm != null);

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Stat cards */}
      {(latestWeight || latestWaist) && (
        <div className="grid grid-cols-2 gap-4">
          {latestWeight && (
            <div className="bg-surface rounded-2xl p-5">
              <p className="text-xs font-medium opacity-40 mb-2">Latest Weight</p>
              <p className="text-3xl font-bold tabular-nums text-blue-500">
                {toDisplay(latestWeight.weight_kg, 2.20462, unitSystem)}
                <span className="text-sm font-normal opacity-60 ml-1.5">{weightUnit}</span>
              </p>
              <p className="text-xs opacity-35 mt-2">
                {parseDay(latestWeight.measured_at).toLocaleDateString()}
              </p>
            </div>
          )}
          {latestWaist && (
            <div className="bg-surface rounded-2xl p-5">
              <p className="text-xs font-medium opacity-40 mb-2">Latest Waist</p>
              <p className="text-3xl font-bold tabular-nums text-orange-500">
                {toDisplay(latestWaist.waist_cm, 0.393701, unitSystem)}
                <span className="text-sm font-normal opacity-60 ml-1.5">{waistUnit}</span>
              </p>
              <p className="text-xs opacity-35 mt-2">
                {parseDay(latestWaist.measured_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Entry */}
      <div className="bg-surface rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold opacity-50 uppercase tracking-wide">Add Entry</h2>
        <AddMeasurementForm unitSystem={unitSystem} />
      </div>

      {/* Chart */}
      <div className="bg-surface rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold opacity-50 uppercase tracking-wide">Chart</h2>
        <MeasurementsChart measurements={allMeasurements} unitSystem={unitSystem} />
      </div>

      {/* Entries */}
      <div className="bg-surface rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold opacity-50 uppercase tracking-wide">Entries</h2>
          <div className="flex items-center gap-1.5 ml-auto">
            <a
              href="/api/export"
              className="text-xs px-2.5 py-1 rounded-lg font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] transition-colors"
            >
              Export CSV
            </a>
            <ImportForm />
          </div>
          {years.length > 0 && (
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <Link
                href="/tracker"
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  !year
                    ? "bg-foreground text-background"
                    : "bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09]"
                }`}
              >
                All
              </Link>
              {years.map((y) => (
                <Link
                  key={y}
                  href={`/tracker?year=${y}`}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    year === String(y)
                      ? "bg-foreground text-background"
                      : "bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09]"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm opacity-40 py-6 text-center">No entries found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    <th className="text-left pb-2.5 pr-6 text-xs font-medium opacity-40 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left pb-2.5 pr-6 text-xs font-medium text-blue-500/70 uppercase tracking-wide">
                      Weight ({weightUnit})
                    </th>
                    <th className="text-left pb-2.5 pr-6 text-xs font-medium text-orange-500/70 uppercase tracking-wide">
                      Waist ({waistUnit})
                    </th>
                    <th className="pb-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} unitSystem={unitSystem} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1 text-sm">
                <span className="text-xs opacity-40">
                  {totalCount} entries · page {page} of {totalPages}
                </span>
                <div className="flex gap-1.5">
                  {page > 1 && (
                    <Link
                      href={`/tracker?${new URLSearchParams({
                        ...(year ? { year } : {}),
                        page: String(page - 1),
                      })}`}
                      className="px-3 py-1.5 rounded-lg text-xs bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] transition-colors"
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
                      className="px-3 py-1.5 rounded-lg text-xs bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
