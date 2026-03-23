"use server";

import { sql } from "@/lib/db";
import { getUser } from "@/lib/dal";
import { revalidatePath } from "next/cache";

export async function updateUnitSystem(
  system: "metric" | "imperial"
): Promise<void> {
  const user = await getUser();
  await sql`UPDATE users SET unit_system = ${system} WHERE id = ${user.id}`;
  revalidatePath("/tracker");
}
