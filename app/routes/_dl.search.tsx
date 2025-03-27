import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getServiceListItems } from "~/models/service.server";
import { Filters } from "./_dl.categories.$slug";
import { ServiceList } from "~/components/service-list";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q");

  if (!query || query.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }

  const services = await getServiceListItems({ query });

  return { services, query };
};

export default function SearchPage() {
  const { services, query } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Заказать «{query}»</h1>
      </div>

      <div className="flex flex-row gap-6 items-start">
        <Filters />

        {services && services.length > 0 ? (
          <ServiceList query={query} initServices={services} />
        ) : (
          <p className="text-gray-600">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}
