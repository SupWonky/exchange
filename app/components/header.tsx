import { CategoryNode } from "~/models/category.server";
import { CategoryMenu } from "./category-menu";
import { MainNav } from "./main-nav";
import { SearchInput } from "./search-input";
import { User } from "./user";
import { Sidebar } from "./sidebar";
import React from "react";
import { mapToNavigationItems } from "~/lib/utils";

export function SiteHeader({ categories }: { categories: CategoryNode[] }) {
  const categoriesItems = React.useMemo(() => {
    return {
      label: "Категории",
      url: "/categories",
      type: "nested" as "nested" | "item",
      children: mapToNavigationItems(categories, {
        getLabelFn: (item) => item.name,
        getUrlFn: (item) => `/categories/${item.slug}`,
        getChildrenFn: (item) => item.children,
      }),
    };
  }, [categories]);

  return (
    <header className="top-0 z-50 w-full border-b bg-background/65 lg:bg-background sticky lg:relative backdrop-blur lg:backdrop-blur-none">
      <div className="container flex h-14 items-center">
        <MainNav />
        <Sidebar
          items={[
            // @ts-expect-error
            categoriesItems,
          ]}
        />
        <SearchInput />

        <div className="flex sm:flex-1 items-center justify-end">
          <User />
        </div>
      </div>

      <CategoryMenu categories={categories} />
    </header>
  );
}

export function SellerHeader() {
  return (
    <header className="top-0 z-50 w-full border-b bg-background/90">
      <div className="container flex h-14 items-center">
        <MainNav />
        <SearchInput />
        <div className="flex flex-1 items-center justify-between md:justify-end">
          <User />
        </div>
      </div>
    </header>
  );
}
