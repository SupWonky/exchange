import { Category } from "@prisma/client";
import { Link, useViewTransitionState } from "@remix-run/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { useState } from "react";
import { cn } from "~/lib/utils";

type CategoryNode = Category & { children: CategoryNode[] };

interface CategoryMenuProps {
  categories: CategoryNode[];
}

export function CategoryMenu({ categories }: CategoryMenuProps) {
  return (
    <nav aria-label="Категории" className="hidden lg:block bg-white border-t">
      <div className="container mx-auto px-4">
        <ul className="flex flex-wrap gap-x-8 justify-center items-center">
          {categories.map((cat) => (
            <CategoryItem key={cat.id} category={cat} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

const COL_THRESHOLD = 7;

function CategoryItem({ category }: { category: CategoryNode }) {
  const [open, setOpen] = useState(false);
  const hasChildren = category.children.length > 0;
  const children = category.children.sort(
    (a, b) => a.children.length - b.children.length
  );

  const [largeCols, items] = category.children.reduce(
    (acc, cat) => {
      if (cat.children.length > COL_THRESHOLD) {
        return [acc[0] + 1, acc[1]];
      }

      return [acc[0], acc[1] + cat.children.length];
    },
    [0, 0]
  );
  const cols = largeCols + Math.ceil(items / 10);

  return hasChildren ? (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={300}
      closeDelay={200}
    >
      <HoverCardTrigger asChild>
        <li className="relative group overflow-visible">
          <Link
            to={`/categories/${category.slug}`}
            className={cn(
              "py-2 block group-hover:text-primary relative transition-colors",
              open && "text-primary"
            )}
          >
            {category.name}
            <span
              className={cn(
                "absolute left-0 bottom-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left",
                open && "scale-x-100"
              )}
            />
          </Link>
        </li>
      </HoverCardTrigger>
      <HoverCardContent
        className="gap-x-16 block w-auto rounded-b-lg"
        align="start"
        sideOffset={0}
        style={{
          columnCount: cols,
        }}
        collisionPadding={16}
      >
        {children.map((sub) => (
          <div key={sub.id} className="break-inside-avoid pb-3">
            <ul className="space-y-1">
              <li className="text-base font-semibold px-2 w-64 list-item">
                <p>{sub.name}</p>
              </li>
              {sub.children.map((child) => (
                <li key={child.id} className="w-64 list-item">
                  <Link
                    to={`/categories/${child.slug}`}
                    role="menuitem"
                    tabIndex={-1}
                    className="block py-2 px-3 rounded-md hover:bg-gray-50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors duration-150 text-sm break-words"
                    onClick={() => setOpen(false)}
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </HoverCardContent>
    </HoverCard>
  ) : (
    <li className="relative group overflow-visible flex-shrink-0">
      <Link
        to={`/categories/${category.slug}`}
        className="py-2 px-4 block group-hover:text-primary relative transition-colors whitespace-nowrap"
        onClick={() => setOpen(false)}
      >
        {category.name}
        <span className="absolute left-0 bottom-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
      </Link>
    </li>
  );
}
