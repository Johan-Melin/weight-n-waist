"use client";

import { useActionState } from "react";
import { addMeasurement } from "@/app/actions/measurements";

type UnitSystem = "metric" | "imperial";

const today = () => new Date().toISOString().split("T")[0];

const inputClass =
  "border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10";

export function AddMeasurementForm({ unitSystem }: { unitSystem: UnitSystem }) {
  const [state, formAction, isPending] = useActionState(addMeasurement, {});
  const isImperial = unitSystem === "imperial";

  return (
    <form
      action={formAction}
      className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end"
    >
      <input type="hidden" name="unit_system" value={unitSystem} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="measured_at" className="text-xs font-medium opacity-50">
          Date
        </label>
        <input
          id="measured_at"
          name="measured_at"
          type="date"
          defaultValue={today()}
          required
          className={inputClass}
        />
        {state.errors?.measured_at && (
          <p className="text-red-500 text-xs">{state.errors.measured_at[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="weight_kg" className="text-xs font-medium text-blue-500/70">
          {isImperial ? "Weight (lbs)" : "Weight (kg)"}
        </label>
        <input
          id="weight_kg"
          name="weight_kg"
          type="number"
          step="0.1"
          min="0"
          placeholder={isImperial ? "e.g. 165.0" : "e.g. 75.5"}
          className={inputClass}
        />
        {state.errors?.weight_kg && (
          <p className="text-red-500 text-xs">{state.errors.weight_kg[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="waist_cm" className="text-xs font-medium text-orange-500/70">
          {isImperial ? "Waist (in)" : "Waist (cm)"}
        </label>
        <input
          id="waist_cm"
          name="waist_cm"
          type="number"
          step="0.1"
          min="0"
          placeholder={isImperial ? "e.g. 32.5" : "e.g. 85.0"}
          className={inputClass}
        />
        {state.errors?.waist_cm && (
          <p className="text-red-500 text-xs">{state.errors.waist_cm[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {state.message && (
          <p className="text-red-500 text-xs">{state.message}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 whitespace-nowrap transition-opacity"
        >
          {isPending ? "Saving…" : "Add Entry"}
        </button>
      </div>
    </form>
  );
}
