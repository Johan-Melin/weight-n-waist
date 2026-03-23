"use client";

import { useRouter } from "next/navigation";

export function YearSelect({
  years,
  currentYear,
}: {
  years: number[];
  currentYear?: string;
}) {
  const router = useRouter();

  if (years.length === 0) return null;

  return (
    <select
      value={currentYear ?? ""}
      onChange={(e) =>
        router.push(
          e.target.value ? `/tracker?year=${e.target.value}` : "/tracker"
        )
      }
      className="text-xs rounded-lg px-2.5 py-1 font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] focus:outline-none transition-colors cursor-pointer"
    >
      <option value="">All years</option>
      {years.map((y) => (
        <option key={y} value={String(y)}>
          {y}
        </option>
      ))}
    </select>
  );
}
