import {
  LoaderFunctionArgs,
  MetaFunction,
  MetaDescriptor,
} from "@remix-run/node";
import {
  Link,
  ShouldRevalidateFunctionArgs,
  useLoaderData,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { CategoryBreadcrumbs } from "~/components/category-breadcrumbs";
import { ConfigurableFilter, FilterSectionType } from "~/components/filters";
import { ServiceList } from "~/components/service-list";
import { SortFilter } from "~/components/sort-filter";
import { siteConfig } from "~/config/site";
import {
  getCategoryTree,
  getCategoryWithChildren,
} from "~/models/category.server";
import { getServiceListItems } from "~/models/service.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  invariant(params.slug, "Slug not found");

  const category = await getCategoryWithChildren({
    slug: params.slug,
  });

  if (!category) {
    throw new Response("Not Found", { status: 404 });
  }

  const categoryTree = await getCategoryTree({ path: category.path });

  if (category.parent) {
    const searchParams = new URL(request.url).searchParams;

    const [minPrice, maxPrice] = searchParams.get("price")?.split("_") ?? [];
    const minReviews = Number(searchParams.get("sminreviews") ?? 0);
    const sortSlug = searchParams.get("sort") ?? undefined;
    const orderQueueParam = searchParams.get("sorderqueue");
    const orderQueue = orderQueueParam ? Number(orderQueueParam) : undefined;

    const [items, totalCount] = await getServiceListItems({
      categoryId: category.id,
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

          ...(orderQueue !== undefined
            ? {
                user: {
                  userInfo: {
                    orderQueue: {
                      lte: orderQueue,
                    },
                  },
                },
              }
            : {}),
        },

        reviewCount: { gte: minReviews },
      },
      sortSlug,
    });

    return {
      category,
      categoryTree,
      services: items.map((item) => item.service),
      totalCount,
    };
  }

  return {
    category,
    categoryTree,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const res: MetaDescriptor[] = [
    { title: `${data?.category.name} - ${siteConfig.name}` },
  ];

  if (data?.category.image) {
    res.push({ property: "og:image", content: data.category.image.url });
  }

  return res;
};

export default function CategoryPage() {
  const { category, services, categoryTree, totalCount } =
    useLoaderData<typeof loader>();

  if (!category.parent) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl lg:text-3xl font-semibold">
          {category.name}
        </h1>
        {category.children && category.children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {category.children.map((category) => (
              <Link
                className="group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl overflow-hidden shadow-lg border"
                key={category.id}
                to={`/categories/${category.slug}`}
                prefetch="intent"
              >
                <div className="aspect-square relative">
                  {/* Image */}
                  {category.image ? (
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Нет изображения</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-70 duration-300 transition-opacity group-hover:opacity-100"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 group-hover:translate-y-0">
                    <h3 className="text-white text-xl font-medium">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Ничего не найдено.</p>
        )}
      </div>
    );
  }

  const filterConfig: FilterSectionType[] = [
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
    {
      id: "sorderqueue",
      title: "Заказов в работе",
      type: "radio",
      paramName: "sorderqueue",
      options: [
        { label: "Нет", value: "0" },
        { label: "До 1", value: "1" },
        { label: "До 3", value: "3" },
        { label: "До 5", value: "5" },
        { label: "До 8", value: "8" },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-semibold">{category.name}</h1>
        <CategoryBreadcrumbs
          className="hidden lg:block"
          categoryTree={categoryTree}
        />
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
          <ServiceList categoryId={category.id} initServices={services} />
        ) : (
          <p className="text-gray-600">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}
