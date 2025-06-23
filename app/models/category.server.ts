import type { Category, Media, PrismaClient } from "@prisma/client";

import { prisma } from "~/db.server";
import { formatSlug } from "~/lib/utils";
import { createId } from "@paralleldrive/cuid2";
import { CacheManager } from "~/lib/cache/manager";

export type CategoryNode = Category & {
  children: CategoryNode[];
  image: Media | null;
};

class CategoryManager {
  constructor(private readonly prismaCategory: PrismaClient["category"]) {}

  async getCategoriesTree() {
    const allCategories = await this.prismaCategory.findMany({
      orderBy: { path: "asc" },
      include: { image: true },
    });
    return this.buildTree(allCategories);
  }

  private buildTree(
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

  async createCategory({
    name,
    parentId,
    imageId,
  }: {
    name: Category["name"];
    parentId?: Category["parentId"];
    imageId?: Media["id"];
  }) {
    CacheManager.revalidateTag("categories");
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

    return this.prismaCategory.create({
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

  async getCategoryWithChildren({ slug }: { slug: Category["slug"] }) {
    return this.prismaCategory.findFirst({
      where: {
        slug,
      },
      include: {
        children: { include: { image: true } },
        parent: true,
        image: true,
      },
    });
  }

  async getCategoryTree({ path }: { path: Category["path"] }) {
    const pathParts = path.split("/");
    return this.prismaCategory.findMany({
      where: {
        id: { in: pathParts },
      },
      orderBy: { path: "asc" },
    });
  }
}

const categoryManager = new CategoryManager(prisma.category);

export { categoryManager };
