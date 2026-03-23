"use server";

import { sql } from "@/lib/db";
import { getUser } from "@/lib/dal";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export type MeasurementActionState = {
  errors?: {
    measured_at?: string[];
    weight_kg?: string[];
    waist_cm?: string[];
  };
  message?: string;
};

const toNum = (v: unknown) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const schema = z
  .object({
    measured_at: z.string().min(1, "Date is required"),
    weight_kg: z
      .number()
      .positive("Must be positive")
      .max(500, "Too large")
      .nullable(),
    waist_cm: z
      .number()
      .positive("Must be positive")
      .max(300, "Too large")
      .nullable(),
  })
  .refine((d) => d.weight_kg !== null || d.waist_cm !== null, {
    message: "Enter at least one measurement",
  });

export async function addMeasurement(
  _prevState: MeasurementActionState,
  formData: FormData
): Promise<MeasurementActionState> {
  const user = await getUser();

  const parsed = schema.safeParse({
    measured_at: formData.get("measured_at"),
    weight_kg: toNum(formData.get("weight_kg")),
    waist_cm: toNum(formData.get("waist_cm")),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      errors: flat.fieldErrors as MeasurementActionState["errors"],
      message: flat.formErrors[0],
    };
  }

  let { measured_at, weight_kg, waist_cm } = parsed.data;

  // Convert from imperial to metric for storage
  const unitSystem = formData.get("unit_system");
  if (unitSystem === "imperial") {
    if (weight_kg != null) weight_kg = weight_kg / 2.20462;
    if (waist_cm != null) waist_cm = waist_cm / 0.393701;
  }

  await sql`
    INSERT INTO measurements (user_id, measured_at, weight_kg, waist_cm)
    VALUES (${user.id}, ${measured_at}, ${weight_kg}, ${waist_cm})
  `;

  revalidatePath("/tracker");
  return {};
}

export type ImportActionState = {
  error?: string;
  imported?: number;
  skipped?: number;
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

export async function importMeasurements(
  _prevState: ImportActionState,
  formData: FormData
): Promise<ImportActionState> {
  const user = await getUser();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Please select a CSV file." };

  const text = await file.text();
  const { headers, rows } = parseCSV(text);

  if (!headers.includes("date")) {
    return { error: "CSV must have a 'date' column (YYYY-MM-DD)." };
  }

  const dateIdx = headers.indexOf("date");
  const weightKgIdx = headers.indexOf("weight_kg");
  const weightLbsIdx = headers.indexOf("weight_lbs");
  const waistCmIdx = headers.indexOf("waist_cm");
  const waistInIdx = headers.indexOf("waist_in");

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const dateStr = row[dateIdx]?.trim();
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      skipped++;
      continue;
    }

    const toN = (idx: number) => {
      if (idx === -1 || row[idx] == null || row[idx] === "") return null;
      const n = parseFloat(row[idx]);
      return isNaN(n) || n <= 0 ? null : n;
    };

    let weightKg =
      weightKgIdx !== -1
        ? toN(weightKgIdx)
        : weightLbsIdx !== -1
        ? (toN(weightLbsIdx) != null ? toN(weightLbsIdx)! / 2.20462 : null)
        : null;

    let waistCm =
      waistCmIdx !== -1
        ? toN(waistCmIdx)
        : waistInIdx !== -1
        ? (toN(waistInIdx) != null ? toN(waistInIdx)! / 0.393701 : null)
        : null;

    if (weightKg === null && waistCm === null) {
      skipped++;
      continue;
    }

    await sql`
      INSERT INTO measurements (user_id, measured_at, weight_kg, waist_cm)
      VALUES (${user.id}, ${dateStr}, ${weightKg}, ${waistCm})
    `;
    imported++;
  }

  revalidatePath("/tracker");
  return { imported, skipped };
}

export async function deleteMeasurement(id: string): Promise<void> {
  const user = await getUser();
  await sql`
    DELETE FROM measurements WHERE id = ${id} AND user_id = ${user.id}
  `;
  revalidatePath("/tracker");
}
