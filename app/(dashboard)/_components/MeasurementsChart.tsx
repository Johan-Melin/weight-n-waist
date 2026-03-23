"use client";

import { useState } from "react";

export type ChartMeasurement = {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
};

type Preset = "1M" | "3M" | "6M" | "1Y" | "ALL";

const PRESETS: { label: string; value: Preset }[] = [
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "All", value: "ALL" },
];

function presetStart(p: Preset): Date {
  const d = new Date();
  if (p === "1M") d.setMonth(d.getMonth() - 1);
  else if (p === "3M") d.setMonth(d.getMonth() - 3);
  else if (p === "6M") d.setMonth(d.getMonth() - 6);
  else if (p === "1Y") d.setFullYear(d.getFullYear() - 1);
  else return new Date(0);
  return d;
}

function parseDay(s: string) {
  return new Date(s + "T00:00:00");
}

function fmtDate(s: string) {
  return parseDay(s).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

type UnitSystem = "metric" | "imperial";

function convertWeight(kg: number | null, unit: UnitSystem) {
  if (kg == null) return null;
  return unit === "imperial" ? kg * 2.20462 : kg;
}
function convertWaist(cm: number | null, unit: UnitSystem) {
  if (cm == null) return null;
  return unit === "imperial" ? cm * 0.393701 : cm;
}

export function MeasurementsChart({
  measurements,
  unitSystem = "metric",
}: {
  measurements: ChartMeasurement[];
  unitSystem?: UnitSystem;
}) {
  const [preset, setPreset] = useState<Preset>("3M");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showWeight, setShowWeight] = useState(true);
  const [showWaist, setShowWaist] = useState(true);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    item: ChartMeasurement;
  } | null>(null);

  const isCustom = customStart !== "" || customEnd !== "";

  const filtered = measurements
    .filter((m) => {
      const d = parseDay(m.measured_at);
      if (isCustom) {
        const s = customStart ? parseDay(customStart) : new Date(0);
        const e = customEnd
          ? new Date(parseDay(customEnd).getTime() + 86399999)
          : new Date();
        return d >= s && d <= e;
      }
      return d >= presetStart(preset);
    })
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at));

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => {
              setPreset(p.value);
              setCustomStart("");
              setCustomEnd("");
            }}
            className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
              !isCustom && preset === p.value
                ? "bg-foreground text-background border-transparent"
                : "border-current/20 hover:border-current/50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className={`text-xs border rounded-md px-2 py-1 bg-background ${
            isCustom ? "border-foreground/40" : "border-current/20"
          }`}
        />
        <span className="text-xs opacity-40">–</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          className={`text-xs border rounded-md px-2 py-1 bg-background ${
            isCustom ? "border-foreground/40" : "border-current/20"
          }`}
        />
        {isCustom && (
          <button
            onClick={() => {
              setCustomStart("");
              setCustomEnd("");
            }}
            className="text-xs opacity-40 hover:opacity-80 px-1"
            aria-label="Clear custom range"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          onClick={() => setShowWeight((v) => !v)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${
            showWeight ? "" : "opacity-35"
          }`}
        >
          <span className="inline-block w-4 h-0.5 rounded bg-blue-500" />
          {unitSystem === "imperial" ? "Weight (lbs)" : "Weight (kg)"}
        </button>
        <button
          onClick={() => setShowWaist((v) => !v)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${
            showWaist ? "" : "opacity-35"
          }`}
        >
          <span className="inline-block w-4 h-0.5 rounded bg-orange-500" />
          {unitSystem === "imperial" ? "Waist (in)" : "Waist (cm)"}
        </button>
      </div>
    </div>
  );

  if (measurements.length === 0) {
    return (
      <div className="border rounded-xl p-10 text-center text-sm opacity-50">
        No measurements yet — add your first entry above.
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-3">
        {controls}
        <div className="border rounded-xl p-10 text-center text-sm opacity-50">
          No entries in this range.
        </div>
      </div>
    );
  }

  // Convert values to display unit
  const displayFiltered = filtered.map((m) => ({
    ...m,
    weight_kg: convertWeight(m.weight_kg, unitSystem),
    waist_cm: convertWaist(m.waist_cm, unitSystem),
  }));

  // Collect values for Y scale
  const vals: number[] = [];
  if (showWeight) displayFiltered.forEach((m) => m.weight_kg != null && vals.push(m.weight_kg));
  if (showWaist) displayFiltered.forEach((m) => m.waist_cm != null && vals.push(m.waist_cm));

  if (vals.length === 0) {
    return (
      <div className="space-y-3">
        {controls}
        <div className="border rounded-xl p-10 text-center text-sm opacity-50">
          No data with current toggles.
        </div>
      </div>
    );
  }

  // Chart geometry
  const VW = 800;
  const VH = 280;
  const PAD = { top: 16, right: 20, bottom: 36, left: 52 };
  const cW = VW - PAD.left - PAD.right;
  const cH = VH - PAD.top - PAD.bottom;

  const timestamps = filtered.map((m) => parseDay(m.measured_at).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const tsRange = maxTs - minTs || 1;
  const xOf = (ts: number) => PAD.left + ((ts - minTs) / tsRange) * cW;

  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const vPad = (rawMax - rawMin) * 0.12 || 2;
  const yMin = rawMin - vPad;
  const yMax = rawMax + vPad;
  const yRange = yMax - yMin;
  const yOf = (v: number) => PAD.top + cH - ((v - yMin) / yRange) * cH;

  const dotR = filtered.length < 60 ? 3.5 : 2;

  const weightPts = showWeight
    ? displayFiltered
        .filter((m) => m.weight_kg != null)
        .map(
          (m) =>
            `${xOf(parseDay(m.measured_at).getTime())},${yOf(m.weight_kg!)}`
        )
        .join(" ")
    : "";

  const waistPts = showWaist
    ? displayFiltered
        .filter((m) => m.waist_cm != null)
        .map(
          (m) =>
            `${xOf(parseDay(m.measured_at).getTime())},${yOf(m.waist_cm!)}`
        )
        .join(" ")
    : "";

  // Y ticks
  const N_Y = 5;
  const yTicks = Array.from({ length: N_Y }, (_, i) => yMin + (yRange * i) / (N_Y - 1));

  // X ticks
  const N_X = Math.min(filtered.length, 7);
  const xIdxs =
    N_X <= 1
      ? [0]
      : Array.from({ length: N_X }, (_, i) =>
          Math.round((i * (filtered.length - 1)) / (N_X - 1))
        );

  return (
    <div className="space-y-3">
      {controls}

      <div className="border rounded-xl overflow-hidden relative select-none">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full"
          style={{ display: "block" }}
        >
          {/* Y grid + labels */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={yOf(v)}
                x2={VW - PAD.right}
                y2={yOf(v)}
                stroke="currentColor"
                strokeOpacity={0.07}
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={yOf(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="currentColor"
                fillOpacity={0.45}
              >
                {v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X labels */}
          {xIdxs.map((idx, i) => {
            const m = filtered[idx];
            const x = xOf(parseDay(m.measured_at).getTime());
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={VH - PAD.bottom}
                  x2={x}
                  y2={VH - PAD.bottom + 4}
                  stroke="currentColor"
                  strokeOpacity={0.25}
                />
                <text
                  x={x}
                  y={VH - PAD.bottom + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  fillOpacity={0.45}
                >
                  {fmtDate(m.measured_at)}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          {showWeight && weightPts && (
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={weightPts}
            />
          )}
          {showWaist && waistPts && (
            <polyline
              fill="none"
              stroke="#f97316"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={waistPts}
            />
          )}

          {/* Dots */}
          {showWeight &&
            displayFiltered.map(
              (m, i) =>
                m.weight_kg != null && (
                  <circle
                    key={`w${i}`}
                    cx={xOf(parseDay(m.measured_at).getTime())}
                    cy={yOf(m.weight_kg)}
                    r={dotR}
                    fill="#3b82f6"
                    className="cursor-pointer"
                    onMouseEnter={(e) =>
                      setTooltip({ x: e.clientX, y: e.clientY, item: m })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
            )}
          {showWaist &&
            displayFiltered.map(
              (m, i) =>
                m.waist_cm != null && (
                  <circle
                    key={`c${i}`}
                    cx={xOf(parseDay(m.measured_at).getTime())}
                    cy={yOf(m.waist_cm)}
                    r={dotR}
                    fill="#f97316"
                    className="cursor-pointer"
                    onMouseEnter={(e) =>
                      setTooltip({ x: e.clientX, y: e.clientY, item: m })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
            )}
        </svg>

        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg shadow-lg px-3 py-2 text-xs"
            style={{ left: tooltip.x + 14, top: tooltip.y - 14 }}
          >
            <div className="font-semibold mb-1">
              {parseDay(tooltip.item.measured_at).toLocaleDateString()}
            </div>
            {tooltip.item.weight_kg != null && (
              <div className="text-blue-500">
                Weight: {typeof tooltip.item.weight_kg === "number" ? tooltip.item.weight_kg.toFixed(1) : tooltip.item.weight_kg}{" "}
                {unitSystem === "imperial" ? "lbs" : "kg"}
              </div>
            )}
            {tooltip.item.waist_cm != null && (
              <div className="text-orange-500">
                Waist: {typeof tooltip.item.waist_cm === "number" ? tooltip.item.waist_cm.toFixed(1) : tooltip.item.waist_cm}{" "}
                {unitSystem === "imperial" ? "in" : "cm"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
