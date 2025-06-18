import { Prisma, PrismaClient, User } from "@prisma/client";

import { singleton } from "./singleton.server";

const prisma = singleton("prisma", () => new PrismaClient());

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
