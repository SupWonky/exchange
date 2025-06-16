import { Prisma, PrismaClient, User } from "@prisma/client";

import { singleton } from "./singleton.server";

// Hard-code a unique key, so we can look up the client when this module gets re-imported
const prisma = singleton("prisma", () => new PrismaClient());

export async function recaclStats(
  userId: User["id"],
  tx: Prisma.TransactionClient
) {
  const total = await tx.review.count({
    where: { service: { userId } },
  });

  const recs = await tx.review.count({
    where: { service: { userId }, recommend: true },
  });

  const averageRating = total > 0 ? (recs / total) * 5 : 0;

  await tx.user.update({
    where: { id: userId },
    data: {
      averageRating,
      reviewsCount: total,
    },
  });
}

prisma.$use(async (params, next) => {
  if (
    params.model === "Review" &&
    ["create", "update", "delete"].includes(params.action)
  ) {
    const serviceId =
      params.args.data?.serviceId || params.args.where?.serviceId;
    const service = await prisma.service.findUniqueOrThrow({
      where: { id: serviceId },
    });
    const userId = service.userId;

    return prisma.$transaction(async (tx) => {
      const result = await next(params);

      await recaclStats(userId, tx);
    });
  }
  return next(params);
});

prisma.$use(async (params, next) => {
  if (params.model === "Service" || params.model === "User") {
    if (params.action === "delete") {
      params.action = "update";
      params.args["data"] = { deletedAt: new Date(Date.now()) };
    }
    if (params.action === "deleteMany") {
      params.action = "updateMany";
      if (params.args.data !== undefined) {
        params.args.data["deletedAt"] = Date.now();
      } else {
        params.args["data"] = { deletedAt: new Date(Date.now()) };
      }
    }
  }
  return next(params);
});

prisma.$use(async (params, next) => {
  // Apply only for the Service model
  if (params.model === "Service") {
    // For findUnique, switch to findFirst so we can add our condition.
    if (params.action === "findUnique") {
      params.action = "findFirst";
    }

    // Apply to queries that return data
    if (["findFirst", "findMany", "count"].includes(params.action)) {
      // Ensure a where clause exists
      params.args.where = {
        deletedAt: null, // Only include records that haven't been soft-deleted
        ...params.args.where,
      };
    }
  }
  return next(params);
});

prisma.$connect();

export { prisma };
