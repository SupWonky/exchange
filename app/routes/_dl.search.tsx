import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getServiceListItems } from "~/models/service.server";
import { ServiceList } from "~/components/service-list";
import { ConfigurableFilter, FilterSectionType } from "~/components/filters";

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

  const filterConfig: FilterSectionType[] = [
    {
      id: "category",
      title: "Категория",
      type: "checkbox",
      paramName: "category",
      options: [
        { value: "electronics", label: "Электроника" },
        { value: "clothing", label: "Одежда" },
        { value: "home", label: "Для дома" },
      ],
    },
    {
      id: "price",
      title: "Цена",
      type: "radio",
      paramName: "price",
      options: [
        { value: "_500", label: "500 руб." },
        { value: "1000_4500", label: "1000 - 4500 руб." },
        { value: "5000_43000", label: "5000 - 43000 руб." },
        { value: "45000_", label: "45000 руб. и выше" },
      ],
    },
    {
      id: "customPrice",
      title: "Своя цена",
      type: "range",
      paramName: "price",
      minPlaceholder: "От руб.",
      maxPlaceholder: "До руб.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Заказать «{query}»</h1>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <ConfigurableFilter
          className="self-start"
          filterSections={filterConfig}
        />

        {services && services.length > 0 ? (
          <ServiceList query={query} initServices={services} />
        ) : (
          <p className="text-gray-600">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}
