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

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseArgs(raw: string[]) {
  const args: Record<string, any> = {
    _: [],
  };

  for (let i = 0; i < raw.length; i++) {
    const token = raw[i];

    if (token.startsWith("--")) {
      const key = token.slice(2);
      const [k, v] = key.split("=");

      if (v !== undefined) {
        args[k] = v;
      } else if (raw[i + 1] && !raw[i + 1].startsWith("-")) {
        args[k] = raw[++i];
      } else {
        args[k] = true;
      }
    } else if (token.startsWith("-") && token.length === 2) {
      args[token[1]] = true;
    } else {
      args._.push(token);
    }
  }

  return args;
}
