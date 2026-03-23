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

  const { measured_at, weight_kg, waist_cm } = parsed.data;

  await sql`
    INSERT INTO measurements (user_id, measured_at, weight_kg, waist_cm)
    VALUES (${user.id}, ${measured_at}, ${weight_kg}, ${waist_cm})
  `;

  revalidatePath("/tracker");
  return {};
}

export async function deleteMeasurement(id: string): Promise<void> {
  const user = await getUser();
  await sql`
    DELETE FROM measurements WHERE id = ${id} AND user_id = ${user.id}
  `;
  revalidatePath("/tracker");
}
