"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";
import { updateUnitSystem } from "@/app/actions/settings";

type UnitSystem = "metric" | "imperial";

export function NavDropdown({
  userName,
  unitSystem,
}: {
  userName: string;
  unitSystem: UnitSystem;
}) {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<UnitSystem>(unitSystem);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setUnit(unitSystem); }, [unitSystem]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function toggleUnit() {
    const next: UnitSystem = unit === "metric" ? "imperial" : "metric";
    setUnit(next);
    startTransition(() => updateUnitSystem(next));
  }

  const isImperial = unit === "imperial";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
      >
        <span className="font-medium">{userName}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`opacity-35 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-surface rounded-xl shadow-lg ring-1 ring-black/[0.06] dark:ring-white/[0.06] z-50 overflow-hidden text-sm">
          <div className="px-4 py-3.5">
            <p className="text-xs font-semibold opacity-35 uppercase tracking-wide mb-3">Settings</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Imperial units</span>
              <button
                onClick={toggleUnit}
                disabled={isPending}
                role="switch"
                aria-checked={isImperial}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:opacity-40 ${
                  isImperial ? "bg-foreground" : "bg-black/[0.12] dark:bg-white/[0.15]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-transform ${
                    isImperial ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs opacity-35 mt-1.5">
              {isImperial ? "lbs & inches" : "kg & cm"}
            </p>
          </div>

          <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
