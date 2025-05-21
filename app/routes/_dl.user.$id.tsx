import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getServiceListByUser } from "~/models/service.server";
import { getUserById } from "~/models/user.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.id, "Not Found");

  const user = await getUserById(params.id);

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  const services = await getServiceListByUser({
    userId: user.id,
    status: "PUBLISHED",
  });

  return { user, services };
};

export default function UserPage() {
  const { user, services } = useLoaderData<typeof loader>();

  return <div></div>;
}
