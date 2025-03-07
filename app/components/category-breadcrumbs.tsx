import { Category } from "@prisma/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Link } from "@remix-run/react";
import * as React from "react";

export function CategoryBreadcrumbs({
  categoryTree,
  lastLink,
}: {
  categoryTree: Category[];
  lastLink?: boolean;
}) {
  if (categoryTree.length < 2) {
    throw new Error("Breadcrumbs should be provided with at least 2 items");
  }

  const lastItem = categoryTree[categoryTree.length - 1];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {categoryTree
          .slice(undefined, categoryTree.length - (lastLink ? 0 : 1))
          .map((category, index) => (
            <React.Fragment key={category.id}>
              <BreadcrumbItem>
                <Link
                  to={`/categories/${category.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {category.name}
                </Link>
              </BreadcrumbItem>

              {index < categoryTree.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        {!lastLink && <BreadcrumbItem>{lastItem.name}</BreadcrumbItem>}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
