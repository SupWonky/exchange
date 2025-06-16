import { LoaderFunctionArgs } from "@remix-run/node";
import { ShouldRevalidateFunctionArgs } from "@remix-run/react";
import { getServiceListItems } from "~/models/service.server";

// export function shouldRevalidate({
//   currentParams,
//   nextParams,
// }: ShouldRevalidateFunctionArgs) {
//   return false;
// }

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const cursor = searchParams.get("cursor");
  const categoryId = searchParams.get("categoryId") || undefined;
  const query = searchParams.get("q") || undefined;

  if (typeof cursor !== "string" || cursor.length === 0) {
    return new Response("Invalid cursor", { status: 400 });
  }

  const [minPrice, maxPrice] = searchParams.get("price")?.split("_") ?? [];
  const minReviews = Number(searchParams.get("sminreviews") ?? 0);

  const [items] = await getServiceListItems({
    cursor,
    categoryId,
    query,
    filters: {
      service: {
        pricingTier: {
          some: {
            price: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          },
        },
      },
      reviewCount: { gte: minReviews },
    },
  });

  return items.map((item) => item.service);
};

export default function Feed() {
  return null;
}
