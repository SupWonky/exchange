import { LoaderFunctionArgs } from "@remix-run/node";
import { getServiceListItems } from "~/models/service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const cursor = searchParams.get("cursor");
  const categoryId = searchParams.get("categoryId") || undefined;
  const query = searchParams.get("q") || undefined;

  if (typeof cursor !== "string" || cursor.length === 0) {
    return new Response("Invalid cursor", { status: 400 });
  }

  const result = await getServiceListItems({ cursor, categoryId, query });

  return result;
};

export default function Feed() {
  return null;
}
