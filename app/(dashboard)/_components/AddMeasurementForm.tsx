"use client";

import { useActionState } from "react";
import { addMeasurement } from "@/app/actions/measurements";

const today = () => new Date().toISOString().split("T")[0];

export function AddMeasurementForm() {
  const [state, formAction, isPending] = useActionState(addMeasurement, {});

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end max-w-2xl">
      <div className="flex flex-col gap-1">
        <label htmlFor="measured_at" className="text-sm font-medium">
          Date
        </label>
        <input
          id="measured_at"
          name="measured_at"
          type="date"
          defaultValue={today()}
          required
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        />
        {state.errors?.measured_at && (
          <p className="text-red-500 text-xs">{state.errors.measured_at[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="weight_kg" className="text-sm font-medium">
          Weight (kg)
        </label>
        <input
          id="weight_kg"
          name="weight_kg"
          type="number"
          step="0.1"
          min="0"
          max="500"
          placeholder="e.g. 75.5"
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        />
        {state.errors?.weight_kg && (
          <p className="text-red-500 text-xs">{state.errors.weight_kg[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="waist_cm" className="text-sm font-medium">
          Waist (cm)
        </label>
        <input
          id="waist_cm"
          name="waist_cm"
          type="number"
          step="0.1"
          min="0"
          max="300"
          placeholder="e.g. 85.0"
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        />
        {state.errors?.waist_cm && (
          <p className="text-red-500 text-xs">{state.errors.waist_cm[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {state.message && (
          <p className="text-red-500 text-xs">{state.message}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? "Saving…" : "Add Entry"}
        </button>
      </div>
    </form>
  );
}
