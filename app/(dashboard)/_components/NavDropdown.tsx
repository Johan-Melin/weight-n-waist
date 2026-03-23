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

  // Sync if server re-renders with new value
  useEffect(() => {
    setUnit(unitSystem);
  }, [unitSystem]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function toggleUnit() {
    const next: UnitSystem = unit === "metric" ? "imperial" : "metric";
    setUnit(next); // optimistic
    startTransition(() => updateUnitSystem(next));
  }

  const isImperial = unit === "imperial";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <span>{userName}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className={`opacity-40 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 border rounded-xl bg-background shadow-lg z-50 overflow-hidden text-sm">
          {/* Units */}
          <div className="px-4 py-3">
            <p className="text-xs font-medium opacity-40 mb-3">Settings</p>
            <div className="flex items-center justify-between">
              <span>Imperial units</span>
              <button
                onClick={toggleUnit}
                disabled={isPending}
                role="switch"
                aria-checked={isImperial}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:opacity-50 ${
                  isImperial ? "bg-foreground" : "bg-foreground/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                    isImperial ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs opacity-40 mt-1.5">
              {isImperial ? "lbs & inches" : "kg & cm"}
            </p>
          </div>

          <div className="border-t" />

          {/* Sign out */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
