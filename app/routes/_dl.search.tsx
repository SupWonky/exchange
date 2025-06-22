import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { serviceManager } from "~/models/service.server";
import { ServiceList } from "~/components/service-list";
import { ConfigurableFilter, FilterSectionType } from "~/components/filters";
import { siteConfig } from "~/config/site";
import { SortFilter } from "~/components/sort-filter";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q") || undefined;
  const [minPrice, maxPrice] = searchParams.get("price")?.split("_") ?? [];
  const minReviews = Number(searchParams.get("sminreviews") ?? 0);
  const sortSlug = searchParams.get("sort") ?? undefined;

  const [items, totalCount] = await serviceManager.getServiceListItems({
    query: query,
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
    sortSlug,
  });

  return { services: items.map((item) => item.service), query, totalCount };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `Результаты поиска по запросу «${data?.query}» - ${siteConfig.name}`,
    },
    {
      name: "description",
      content: `Результаты поиска по запросу «${data?.query}» - Больше чем биржа фриланса`,
    },
    {
      name: "og:title",
      content: `Результаты поиска по запросу «${data?.query}» - ${siteConfig.name}`,
    },
    {
      name: "og:description",
      content: `Результаты поиска по запросу «${data?.query}» - Больше чем биржа фриланса`,
    },
  ];
};

export default function SearchPage() {
  const { services, query, totalCount } = useLoaderData<typeof loader>();

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
    {
      id: "sminreviews",
      title: "Положительных отзывов",
      type: "radio",
      paramName: "sminreviews",
      options: [
        { label: "От 1", value: "1" },
        { label: "От 5", value: "5" },
        { label: "От 20", value: "20" },
        { label: "От 100", value: "100" },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">
          {query ? `Заказать «${query}»` : "Все услуги"}
        </h1>
      </div>

      <div className="flex flex-row justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {totalCount} результатов
        </div>

        <SortFilter />
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
