import { PricingTier, PricingTierOption, Service } from "@prisma/client";
import { prisma } from "~/db.server";

// Helper to transform options.
function transformOption({
  value,
  ...optionProps
}: Pick<PricingTierOption, "name" | "type"> & { value: string | boolean }) {
  return {
    ...optionProps,
    ...(typeof value === "string"
      ? { stringValue: value }
      : { booleanValue: value }),
  };
}

export async function createPricings({
  pricings,
  serviceId,
}: {
  pricings: (Pick<
    PricingTier,
    "price" | "duration" | "volume" | "description" | "variant"
  > & {
    options?: (Pick<PricingTierOption, "name" | "type"> & {
      value: string | boolean;
    })[];
  })[];
  serviceId: Service["id"];
}) {
  return Promise.all(
    pricings.map(({ options, ...props }) =>
      prisma.pricingTier.create({
        data: {
          ...props,
          serviceId,
          options: options
            ? { create: options.map(transformOption) }
            : undefined,
        },
      })
    )
  );
}

export async function updatePricings({
  pricings,
}: {
  pricings: (Pick<
    PricingTier,
    "id" | "price" | "duration" | "volume" | "description" | "variant"
  > & {
    options?: (Pick<PricingTierOption, "name" | "type"> & {
      value: string | boolean;
    })[];
  })[];
}) {
  return Promise.all(
    pricings.map(({ id, options, ...props }) =>
      prisma.$transaction(async (tx) => {
        await tx.pricingTierOption.deleteMany({
          where: { pricingTierId: id },
        });
        return tx.pricingTier.update({
          where: { id },
          data: {
            ...props,
            options: options
              ? { create: options.map(transformOption) }
              : undefined,
          },
        });
      })
    )
  );
}

export async function getPricingListByService(serviceId: Service["id"]) {
  return prisma.pricingTier.findMany({
    where: { serviceId },
    include: { options: true },
  });
}

export async function getPricing(id: PricingTier["id"]) {
  return prisma.pricingTier.findUnique({
    where: {
      id,
    },
    include: {
      service: true,
    },
  });
}
