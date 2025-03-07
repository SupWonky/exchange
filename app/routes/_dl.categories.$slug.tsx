import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { CategoryBreadcrumbs } from "~/components/category-breadcrumbs";
import { SearchCheckbox } from "~/components/search-checkbox";
import { ServiceList } from "~/components/service-list";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import {
  getCategoryTree,
  getCategoryWithChildren,
} from "~/models/category.server";
import { getServiceItemsByCategory } from "~/models/service.server";

export async function loader({ params }: LoaderFunctionArgs) {
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
    services = await getServiceItemsByCategory({
      categoryId: category.id,
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
  // Otherwise, the category is a sub-category so render its services.
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">{category.name}</h1>
        <CategoryBreadcrumbs categoryTree={categoryTree} />
      </div>

      <div className="flex flex-row gap-6 items-start">
        <Filters />
        {services && services.length > 0 ? (
          <ServiceList categoryId={category.id} initServices={services} />
        ) : (
          <p className="text-gray-600">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}

export function Filters() {
  const [searchParams] = useSearchParams();
  return (
    <aside className="w-64 shrink-0 bg-card shadow rounded-lg border p-4">
      <div className="space-y-4 text-base">
        {/* Preset Price Filters */}
        <div>
          <h3 className="font-semibold mb-1">Цена</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SearchCheckbox name="price" value="_500" />
              <label htmlFor="price">
                <Link to="?price=_500">500 руб.</Link>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <SearchCheckbox name="price" value="1000_4500" />
              <label htmlFor="price">
                <Link to="?price=1000_4500">1000 - 4500 руб.</Link>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <SearchCheckbox name="price" value="5000_43000" />
              <label htmlFor="price">
                <Link to="?price=5000_43000">5000 - 43000 руб.</Link>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <SearchCheckbox name="price" value="45000_" />
              <label htmlFor="price">
                <Link to="?price=45000_">45000 руб. и выше</Link>
              </label>
            </div>
          </div>
        </div>

        {/* Custom Price Filter */}
        <div>
          <h3 className="font-semibold mb-1">Своя цена</h3>
          <form method="get" className="flex flex-col space-y-2">
            <div className="flex flex-row gap-2">
              <Input
                type="number"
                name="minPrice"
                id="minPrice"
                placeholder="От руб."
                className="appearance-none [-moz-appearance:textfield]"
                defaultValue={searchParams.get("minPrice") || ""}
              />
              <Input
                type="number"
                name="maxPrice"
                id="maxPrice"
                placeholder="До руб."
                className="appearance-none [-moz-appearance:textfield]"
                defaultValue={searchParams.get("maxPrice") || ""}
              />
            </div>
            <Button type="submit" variant="outline">
              Применить
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
