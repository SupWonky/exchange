import { LoaderFunctionArgs } from "@remix-run/node";
import { getServiceListCursor } from "~/models/service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const cursor = searchParams.get("cursor");
  const categoryId = searchParams.get("categoryId");

  if (typeof cursor !== "string" || cursor.length === 0) {
    return new Response("Invalid cursor", { status: 400 });
  }

  if (typeof categoryId !== "string" || categoryId.length === 0) {
    return new Response("Invalid categoryId", { status: 400 });
  }

  const result = await getServiceListCursor({ cursor, categoryId });

  return result;
};

export default function Feed() {
  return null;
}
