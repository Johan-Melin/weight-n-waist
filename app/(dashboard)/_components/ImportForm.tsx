"use client";

import { useActionState, useRef } from "react";
import { importMeasurements } from "@/app/actions/measurements";

export function ImportForm() {
  const [state, formAction, isPending] = useActionState(importMeasurements, {});
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="contents">
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) {
            e.target.form?.requestSubmit();
          }
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="text-xs px-2.5 py-1 rounded-lg font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] transition-colors disabled:opacity-40"
        >
          {isPending ? "Importing…" : "Import CSV"}
        </button>
        {state.imported != null && (
          <span className="text-xs opacity-60">
            Imported {state.imported} row{state.imported !== 1 ? "s" : ""}
            {state.skipped ? `, skipped ${state.skipped}` : ""}
          </span>
        )}
        {state.error && (
          <span className="text-xs text-red-500">{state.error}</span>
        )}
      </div>
    </form>
  );
}
