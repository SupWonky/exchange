import { PricingTierOption } from "@prisma/client";
import { prisma } from "~/db.server";

export async function createOption({
  name,
  pricingTierId,
  value,
  type,
}: {
  name: PricingTierOption["name"];
  value: string | boolean;
  type: PricingTierOption["type"];
  pricingTierId: PricingTierOption["pricingTierId"];
}) {
  return prisma.pricingTierOption.create({
    data: {
      name,
      type,
      pricingTier: {
        connect: {
          id: pricingTierId,
        },
      },
      ...(typeof value === "boolean"
        ? { booleanValue: value }
        : { stringValue: value }),
    },
  });
}
