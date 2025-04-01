import { Prisma } from "@prisma/client";

type FilterValue = Prisma.IntFilter | Prisma.BoolFilter | Prisma.StringFilter;
export type FilterObject = { [key: string]: FilterValue };

/**
 * Parse search parameters into a Prisma filter object
 * @param searchParams - URL search parameters or object with filter keys and values
 * @returns Prisma-compatible where clause
 */

export function parseFilters(params: Record<string, string>) {
  const filters: FilterObject = {};

  for (const [key, value] of Object.entries(params)) {
    if (!value || value === "") continue;

    if (value.includes("_")) {
    }
  }
}
