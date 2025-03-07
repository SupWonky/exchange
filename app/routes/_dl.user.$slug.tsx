import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getUserById } from "~/models/user.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.slug, "Slug not found");

  const user = await getUserById(params.slug);

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  return { user };
};

export function UserPage() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{user.email}</h1>
    </div>
  );
}
