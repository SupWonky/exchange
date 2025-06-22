import { type SerializeFrom } from "@remix-run/node";
import { useMatches } from "@remix-run/react";

export function useParentData<T extends (...args: any[]) => any>(
  routeId: string
): SerializeFrom<T> | undefined {
  const matches = useMatches();
  console.log(matches);
  const match = matches.find((m) => m.id === routeId);
  return match?.data as SerializeFrom<T>;
}
