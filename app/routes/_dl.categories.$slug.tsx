import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { CategoryBreadcrumbs } from "~/components/category-breadcrumbs";
import { ConfigurableFilter, FilterSectionType } from "~/components/filters";
import { ServiceList } from "~/components/service-list";
import {
  getCategoryTree,
  getCategoryWithChildren,
} from "~/models/category.server";
import { getServiceItemsByCategory } from "~/models/service.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  invariant(params.slug, "Slug not found");

  const category = await getCategoryWithChildren({
    slug: params.slug,
  });

  if (!category) {
    throw new Response("Not Found", { status: 404 });
  }

  const categoryTree = await getCategoryTree({ path: category.path });

  let services = undefined;
  if (category.parent) {
    const searchParams = new URL(request.url).searchParams;

    const prices = searchParams.get("price")?.split("_");

    services = await getServiceItemsByCategory({
      categoryId: category.id,
      filters: {
        pricingTier: {
          some: {
            price: {
              ...(prices?.at(0) ? { gte: Number(prices[0]) } : {}),
              ...(prices?.at(1) ? { lte: Number(prices[1]) } : {}),
            },
          },
        },
      },
    });
  }
  return { category, services, categoryTree };
}

export default function CategoryPage() {
  const { category, services, categoryTree } = useLoaderData<typeof loader>();

  // If the category is a root category (no parent), render its child categories.
  if (!category.parent) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-3xl font-semibold">{category.name}</h1>
        {category.children && category.children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {category.children.map((category) => (
              <Link
                className="group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                key={category.id}
                to={`/categories/${category.slug}`}
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

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>

                  {/* Category name - positioned at bottom for better readability */}
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
  // Otherwise, the category is a sub-category so render its services.
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">
          {category.name}
        </h1>
        <CategoryBreadcrumbs
          className="hidden lg:block"
          categoryTree={categoryTree}
        />
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
