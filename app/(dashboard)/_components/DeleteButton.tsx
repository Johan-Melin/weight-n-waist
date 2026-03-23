"use client";

import { useTransition } from "react";
import { deleteMeasurement } from "@/app/actions/measurements";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this entry?")) return;
        startTransition(() => deleteMeasurement(id));
      }}
      className="text-xs text-red-500 hover:underline disabled:opacity-40"
    >
      {isPending ? "…" : "Delete"}
    </button>
  );
}
