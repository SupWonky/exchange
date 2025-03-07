import { Category } from "@prisma/client";
import { Link } from "@remix-run/react";

type CategoryNode = Category & {
  children: CategoryNode[];
};

interface CategoryMenuProps {
  categories: CategoryNode[];
}

export function CategoryMenu({ categories }: CategoryMenuProps) {
  return (
    <nav className="border-b bg-background">
      <ul className="container mx-auto flex gap-8 px-4">
        {categories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </ul>
    </nav>
  );
}

function CategoryItem({ category }: { category: CategoryNode }) {
  return (
    <li className="relative group">
      <Link
        to={`/categories/${category.slug}`}
        className="py-2 block group-hover:text-primary relative transition-colors"
      >
        {category.name}
        <span className="absolute left-0 bottom-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      </Link>
      {category.children.length > 0 && (
        <div className="absolute left-0 top-full bg-white border opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity z-10">
          <div className="grid grid-rows-2 gap-6 min-w-[200px] w-full py-4">
            {category.children.map((subCategory) => (
              <div key={subCategory.id}>
                <h4 className="text-lg font-semibold mb-2.5 px-6 text-gray-800 whitespace-nowrap">
                  {subCategory.name}
                </h4>
                <ul>
                  {subCategory.children.map((child) => (
                    <li
                      className="relative before:absolute before:top-0 before:bottom-0 hover:before:w-0.5 before:bg-primary"
                      key={child.id}
                    >
                      <Link
                        to={`/categories/${child.slug}`}
                        className="block py-1 px-6 hover:text-primary transition-colors whitespace-nowrap"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
