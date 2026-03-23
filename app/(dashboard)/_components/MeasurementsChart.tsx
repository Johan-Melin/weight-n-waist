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

  const btnBase = "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors";
  const btnActive = "bg-foreground text-background";
  const btnIdle = "bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.08] dark:hover:bg-white/[0.10]";
  const dateInput = "text-xs rounded-lg px-2 py-1 bg-background border border-black/[0.08] dark:border-white/[0.08] focus:outline-none";

  const controls = (
    <div className="space-y-2">
      {/* Row 1: presets + legend */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => { setPreset(p.value); setCustomStart(""); setCustomEnd(""); }}
              className={`${btnBase} ${!isCustom && preset === p.value ? btnActive : btnIdle}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <button onClick={() => setShowWeight((v) => !v)} className={`flex items-center gap-1.5 text-xs transition-opacity ${showWeight ? "" : "opacity-30"}`}>
            <span className="inline-block w-3.5 h-[2px] rounded-full bg-blue-500" />
            <span className={showWeight ? "text-blue-500" : ""}>{unitSystem === "imperial" ? "lbs" : "kg"}</span>
          </button>
          <button onClick={() => setShowWaist((v) => !v)} className={`flex items-center gap-1.5 text-xs transition-opacity ${showWaist ? "" : "opacity-30"}`}>
            <span className="inline-block w-3.5 h-[2px] rounded-full bg-orange-500" />
            <span className={showWaist ? "text-orange-500" : ""}>{unitSystem === "imperial" ? "in" : "cm"}</span>
          </button>
        </div>
      </div>
      {/* Row 2: custom date range */}
      <div className="flex items-center gap-1.5">
        <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={`${dateInput} flex-1 min-w-0`} />
        <span className="text-xs opacity-30 shrink-0">–</span>
        <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={`${dateInput} flex-1 min-w-0`} />
        {isCustom && (
          <button onClick={() => { setCustomStart(""); setCustomEnd(""); }} className="text-xs opacity-30 hover:opacity-60 shrink-0" aria-label="Clear">
            ✕
          </button>
        )}
      </div>
    </div>
  );

  if (measurements.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center text-sm opacity-40 bg-background">
        No measurements yet — add your first entry above.
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-3">
        {controls}
        <div className="rounded-xl p-10 text-center text-sm opacity-40 bg-background">
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

      <div className="rounded-xl overflow-hidden relative select-none bg-background">
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
            className="fixed z-50 pointer-events-none bg-surface shadow-lg ring-1 ring-black/[0.06] dark:ring-white/[0.06] rounded-lg px-3 py-2 text-xs"
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
