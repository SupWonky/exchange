import type { Category, Media } from "@prisma/client";

import { prisma } from "~/db.server";
import { formatSlug } from "~/lib/utils";
import { createId } from "@paralleldrive/cuid2";

export async function getCategoriesTree() {
  const allCategories = await prisma.category.findMany({
    orderBy: { path: "asc" },
    include: { image: true },
  });
  return buildTree(allCategories);
}

export type CategoryNode = Category & {
  children: CategoryNode[];
  image: Media | null;
};

function buildTree(
  categories: (Category & { image: Media | null })[]
): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Create nodes first
  categories.forEach((category) => {
    // This cast is safe because we're adding the children array
    map.set(category.id, { ...category, children: [] } as CategoryNode);
  });

  // Build tree structure
  map.forEach((category) => {
    if (category.parentId) {
      const parent = map.get(category.parentId);
      if (parent) {
        parent.children.push(category);
      }
    } else {
      roots.push(category);
    }
  });

  return roots;
}

export async function createCategory({
  name,
  parentId,
  imageId,
}: {
  name: Category["name"];
  parentId?: Category["parentId"];
  imageId?: Media["id"];
}) {
  const slug = formatSlug(name);

  const categoryId = createId();
  let path = "";

  if (parentId) {
    const parent = await prisma.category.findUniqueOrThrow({
      select: { path: true },
      where: {
        id: parentId,
      },
    });

    path = `${parent.path}/${categoryId}`;
  } else {
    path = `${categoryId}`;
  }

  return prisma.category.create({
    data: {
      id: categoryId,
      name,
      slug,
      parentId,
      path,
      imageId,
    },
  });
}

export async function getCategoryWithChildren({
  slug,
}: {
  slug: Category["slug"];
}) {
  return prisma.category.findUnique({
    where: {
      slug,
    },
    include: {
      children: { include: { image: true } },
      parent: true,
    },
  });
}

export async function getCategoryTree({ path }: { path: Category["path"] }) {
  const pathParts = path.split("/");
  return prisma.category.findMany({
    where: {
      id: { in: pathParts },
    },
    orderBy: { path: "asc" },
  });
}
