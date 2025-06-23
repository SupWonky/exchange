import {
  Category,
  Media,
  Prisma,
  PrismaClient,
  Service,
  User,
} from "@prisma/client";
import { prisma } from "~/db.server";
import { CacheManager } from "~/lib/cache/manager";
import { sorting } from "~/lib/constants";
import { formatSlug } from "~/lib/utils";

class ServiceManager {
  constructor(private readonly prismaService: PrismaClient["service"]) {}

  async getServiceById(id: Service["id"]) {
    return prisma.service.findUnique({
      where: { id },
      include: {
        media: true,
        category: {
          include: { children: true },
        },
        pricingTier: true,
      },
    });
  }

  async getServiceBySlug(slug: Service["slug"]) {
    return prisma.service.findFirst({
      where: {
        slug,
      },
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

  async getServiceListByUser({
    userId,
    status,
  }: {
    userId: User["id"];
    status?: Service["status"];
  }) {
    return this.prismaService.findMany({
      where: {
        userId,
        status,
      },
      include: { media: true, user: true, pricingTier: true },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async getServiceListItems({
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

  async createService({
    title,
    userId,
    categoryId,
    media,
    description,
  }: Pick<Service, "title" | "userId" | "categoryId" | "description"> & {
    media?: { url: Media["url"]; type: Media["type"]; name?: Media["name"] }[];
  }) {
    CacheManager.revalidateTag("services");
    const slug = formatSlug(title);

    return this.prismaService.create({
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

  async updateService({
    id,
    title,
    categoryId,
    media,
    description,
  }: Pick<Service, "id" | "title" | "categoryId" | "description"> & {
    media?: { url: Media["url"]; type: Media["type"]; name?: Media["name"] }[];
  }) {
    CacheManager.revalidateTag("services");

    const slug = formatSlug(title);

    await this.prismaService.update({
      data: {
        media: {
          deleteMany: {},
        },
      },
      where: {
        id,
      },
    });

    return this.prismaService.update({
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

  async updateServiceStatus({
    id,
    status,
  }: {
    id: Service["id"];
    status: Service["status"];
  }) {
    CacheManager.revalidateTag("services");

    return this.prismaService.update({
      data: {
        status,
      },
      where: { id },
    });
  }

  async deleteService(id: Service["id"]) {
    CacheManager.revalidateTag("services");

    return this.prismaService.delete({
      where: { id },
    });
  }

  async view(id: Service["id"]) {
    CacheManager.revalidateTag("services");

    return this.prismaService.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });
  }
}

const serviceManager = new ServiceManager(prisma.service);

export { serviceManager };
