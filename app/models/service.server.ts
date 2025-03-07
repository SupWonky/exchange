import { Category, Media, Service, User } from "@prisma/client";

import { prisma } from "~/db.server";
import { formatSlug } from "~/lib/utils";

export async function getServiceListItems() {
  return prisma.service.findMany({
    select: { id: true, title: true, media: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
}

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

export async function getServiceListCursor({
  cursor,
  categoryId,
}: {
  cursor: string;
  categoryId: Category["id"];
}) {
  return prisma.service.findMany({
    include: { media: true, user: true, pricingTier: true },
    where: { category: { path: { startsWith: `%${categoryId}` } } },
    cursor: {
      id: cursor,
    },
    skip: 1,
    take: 6,
    orderBy: {
      id: "asc",
    },
  });
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

export async function getServiceItemsByCategory({
  categoryId,
}: {
  categoryId: Category["id"];
}) {
  return prisma.service.findMany({
    where: { category: { path: { startsWith: `%${categoryId}` } } },
    include: { media: true, user: true, pricingTier: true },
    take: 6,
  });
}

export async function getServiceBySlug({ slug }: { slug: Service["slug"] }) {
  return prisma.service.findFirst({
    where: { slug },
    include: {
      reviews: true,
      user: true,
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

export async function getServiceById({ id }: { id: Service["id"] }) {
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

export async function deleteService({ id }: { id: Service["id"] }) {
  return prisma.service.delete({
    where: {
      id,
    },
  });
}
