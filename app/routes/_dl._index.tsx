import { type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getCategoriesTree } from "~/models/category.server";

export const meta: MetaFunction = () => [{ title: "EasyWork" }];

export const loader = async () => {
  const categories = await getCategoriesTree();
  return categories;
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto px-4 py-6">
      <div>
        <h2 className="text-2xl font-semibold mb-6">
          Выберите рубрику, чтобы начать
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {data.map((category) => (
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
      </div>
    </div>
  );
}
