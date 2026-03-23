"use client";

import { useState, useTransition } from "react";
import { updateMeasurement, deleteMeasurement } from "@/app/actions/measurements";

type UnitSystem = "metric" | "imperial";
type Entry = {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
};

function toDisplay(val: number | null, factor: number, unit: UnitSystem): string {
  if (val == null) return "";
  return unit === "imperial" ? (val * factor).toFixed(1) : String(val);
}

function fromDisplay(str: string, factor: number, unit: UnitSystem): number | null {
  if (str.trim() === "") return null;
  const n = parseFloat(str);
  if (isNaN(n) || n <= 0) return null;
  return unit === "imperial" ? n / factor : n;
}

function PenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function EntryRow({
  entry,
  unitSystem,
}: {
  entry: Entry;
  unitSystem: UnitSystem;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(entry.measured_at);
  const [weight, setWeight] = useState(toDisplay(entry.weight_kg, 2.20462, unitSystem));
  const [waist, setWaist] = useState(toDisplay(entry.waist_cm, 0.393701, unitSystem));
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setDate(entry.measured_at);
    setWeight(toDisplay(entry.weight_kg, 2.20462, unitSystem));
    setWaist(toDisplay(entry.waist_cm, 0.393701, unitSystem));
    setEditing(true);
  }

  function save() {
    const weight_kg = fromDisplay(weight, 2.20462, unitSystem);
    const waist_cm = fromDisplay(waist, 0.393701, unitSystem);
    if (weight_kg === null && waist_cm === null) return;
    startTransition(async () => {
      await updateMeasurement(entry.id, date, weight_kg, waist_cm);
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    startTransition(() => deleteMeasurement(entry.id));
  }

  const inputClass =
    "w-full border rounded px-2 py-1 text-sm bg-background tabular-nums";

  if (editing) {
    return (
      <tr className="border-b last:border-0 bg-black/[0.02] dark:bg-white/[0.02]">
        <td className="py-1.5 pr-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </td>
        <td className="py-1.5 pr-4">
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
          />
        </td>
        <td className="py-1.5 pr-4">
          <input
            type="number"
            step="0.1"
            min="0"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            className={inputClass}
          />
        </td>
        <td className="py-1.5">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={save}
              disabled={isPending}
              title="Save"
              className="text-green-600 hover:text-green-700 disabled:opacity-40"
            >
              <CheckIcon />
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={isPending}
              title="Cancel"
              className="opacity-40 hover:opacity-80"
            >
              <XIcon />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const fmtVal = (val: number | null, factor: number) =>
    val == null ? "–" : unitSystem === "imperial" ? (val * factor).toFixed(1) : String(val);

  return (
    <tr className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
      <td className="py-2.5 pr-6 tabular-nums">
        {new Date(entry.measured_at + "T00:00:00").toLocaleDateString()}
      </td>
      <td className="py-2.5 pr-6 tabular-nums">
        {fmtVal(entry.weight_kg, 2.20462)}
      </td>
      <td className="py-2.5 pr-6 tabular-nums">
        {fmtVal(entry.waist_cm, 0.393701)}
      </td>
      <td className="py-2.5">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={startEdit}
            title="Edit"
            className="opacity-40 hover:opacity-80 transition-opacity"
          >
            <PenIcon />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            title="Delete"
            className="opacity-40 hover:opacity-80 hover:text-red-500 transition-opacity disabled:opacity-20"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}
