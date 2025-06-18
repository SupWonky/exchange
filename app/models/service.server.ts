import { Category, Media, Prisma, Service, User } from "@prisma/client";
import { prisma } from "~/db.server";
import { SortFilterItem, sorting } from "~/lib/constants";
import { formatSlug } from "~/lib/utils";

export async function getServiceListByUser({
  userId,
  status,
}: {
  userId: User["id"];
  status?: Service["status"];
}) {
  return prisma.service.findMany({
    where: {
      userId,
      status,
    },
    include: { media: true, user: true, pricingTier: true },
  });
}

export async function getServiceListItems({
  cursor,
  categoryId,
  query,
  filters,
  sortSlug,
}: {
  cursor?: string;
  categoryId?: Category["id"];
  query?: string;
  filters?: Prisma.ServiceInfoWhereInput;
  sortSlug?: string;
}) {
  const andFilters: Prisma.ServiceInfoWhereInput[] = [];
  let orderBy: Prisma.ServiceInfoOrderByWithRelationInput = {};

  if (categoryId) {
    andFilters.push({
      service: {
        category: {
          path: { startsWith: `%${categoryId}` },
        },
      },
    });
  }

  if (filters) {
    andFilters.push(filters);
  }

  if (query) {
    orderBy._relevance = {
      fields: ["title", "description", "requiredInfo"],
      search: query,
      sort: "desc",
    };
  } else {
    const sort = sorting.find((item) => item.slug === sortSlug);

    switch (sort?.sort_key) {
      case "LATEST":
        orderBy = { service: { createdAt: "desc" } };
        break;
      default:
        orderBy = { service: { views: "desc" } };
        break;
    }
  }

  return Promise.all([
    prisma.serviceInfo.findMany({
      include: {
        service: {
          include: {
            media: true,
            user: { include: { userInfo: true, avatar: true } },
            pricingTier: { where: { variant: "BASIC" } },
          },
        },
      },
      where: { AND: andFilters },
      take: 6,
      orderBy,
      ...(cursor ? { cursor: { serviceId: cursor }, skip: 1 } : {}),
    }),
    prisma.serviceInfo.count({
      where: { AND: andFilters },
    }),
  ]);
}

export async function createService({
  title,
  userId,
  categoryId,
  media,
  description,
}: Pick<Service, "title" | "userId" | "categoryId" | "description"> & {
  media?: { url: Media["url"]; type: Media["type"]; name?: Media["name"] }[];
}) {
  const slug = formatSlug(title);

  return prisma.service.create({
    data: {
      slug,
      title,
      userId,
      categoryId,
      description,
      media: {
        create: media,
      },
    },
  });
}

export async function updateService({
  id,
  title,
  categoryId,
  media,
  description,
}: Pick<Service, "id" | "title" | "categoryId" | "description"> & {
  media?: { url: Media["url"]; type: Media["type"]; name?: Media["name"] }[];
}) {
  const slug = formatSlug(title);

  await prisma.service.update({
    data: {
      media: {
        deleteMany: {},
      },
    },
    where: {
      id,
    },
  });

  return prisma.service.update({
    data: {
      slug,
      title,
      categoryId,
      description,
      media: {
        create: media,
      },
    },
    where: {
      id,
    },
  });
}

export async function updateServiceStatus({
  id,
  status,
}: {
  id: Service["id"];
  status: Service["status"];
}) {
  return prisma.service.update({
    data: {
      status,
    },
    where: { id },
  });
}

export async function getServiceBySlug(slug: Service["slug"]) {
  return prisma.service.findFirst({
    where: { slug },
    include: {
      reviews: true,
      user: { include: { userInfo: true, avatar: true } },
      media: true,
      category: true,
      pricingTier: {
        include: {
          options: true,
        },
      },
    },
  });
}

export async function getServiceById(id: Service["id"]) {
  return prisma.service.findFirst({
    where: { id },
    include: {
      media: true,
      category: {
        include: {
          children: true,
        },
      },
      pricingTier: true,
    },
  });
}

export async function deleteService(id: Service["id"]) {
  return prisma.service.delete({
    where: {
      id,
    },
  });
}

export async function viewService(id: Service["id"]) {
  return prisma.service.update({
    where: { id },
    data: {
      views: { increment: 1 },
    },
  });
}
