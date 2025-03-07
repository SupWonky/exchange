import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createCategory } from "~/models/category.server";
import { placeOrder } from "~/models/order.server";

const prisma = new PrismaClient();

async function seed() {
  // ─── CLEAN UP EXISTING DATA ─────────────────────────────
  console.log("Cleaning up the database...");

  // Delete in an order that avoids foreign key issues.
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.password.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.media.deleteMany({});

  // ─── CREATE USERS ─────────────────────────────────────────
  const rachelPassword = await bcrypt.hash("racheliscool", 10);
  const johnPassword = await bcrypt.hash("johnspassword", 10);
  const emmaPassword = await bcrypt.hash("emmaspassword", 10);

  const rachel = await prisma.user.create({
    data: {
      email: "rachel@remix.run",
      password: { create: { hash: rachelPassword } },
    },
  });

  const john = await prisma.user.create({
    data: {
      email: "john@example.com",
      password: { create: { hash: johnPassword } },
      balance: 20000,
    },
  });

  const emma = await prisma.user.create({
    data: {
      email: "emma@example.com",
      password: { create: { hash: emmaPassword } },
    },
  });

  console.log("Created users:");

  console.log(` - ${rachel.email}`);
  console.log(` - ${john.email}`);
  console.log(` - ${emma.email}`);

  // ─── CREATE CATEGORIES ──────────────────────────────────────
  // Create two root categories.

  const image = await prisma.media.create({
    data: {
      type: "IMAGE",
      url: "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80",
    },
  });

  const seoAndTraffic = await createCategory({
    name: "SEO и траффик",
    imageId: image.id,
  });

  const seo = await createCategory({
    name: "SEO",
    parentId: seoAndTraffic.id,
    imageId: image.id,
  });
  const traffic = await createCategory({
    name: "Траффик",
    parentId: seoAndTraffic.id,
    imageId: image.id,
  });

  const links = await createCategory({
    name: "Ссылки",
    parentId: seo.id,
    imageId: image.id,
  });
  const promotion = await createCategory({
    name: "Продвижение сайта в топ",
    parentId: seo.id,
    imageId: image.id,
  });
  const siteOptimization = await createCategory({
    name: "Внутрення оптимизация",
    parentId: seo.id,
    imageId: image.id,
  });

  const activity = await createCategory({
    name: "Посетители на сайт",
    parentId: traffic.id,
    imageId: image.id,
  });
  const factors = await createCategory({
    name: "Поведенческие факторы",
    parentId: traffic.id,
    imageId: image.id,
  });

  const design = await createCategory({ name: "Дизайн", imageId: image.id });

  const logoAndBrands = await createCategory({
    name: "Логотип и брендинг",
    parentId: design.id,
    imageId: image.id,
  });
  const presentationAndCharts = await createCategory({
    name: "Презентации и инфографика",
    parentId: design.id,
    imageId: image.id,
  });

  const logo = await createCategory({
    name: "Логотипы",
    parentId: logoAndBrands.id,
    imageId: image.id,
  });
  const preview = await createCategory({
    name: "Визитки",
    parentId: logoAndBrands.id,
    imageId: image.id,
  });

  const presentation = await createCategory({
    name: "Презентация",
    parentId: presentationAndCharts.id,
    imageId: image.id,
  });
  const charts = await createCategory({
    name: "Инфографика",
    parentId: presentationAndCharts.id,
    imageId: image.id,
  });

  console.log("Created categories");

  // ─── CREATE SERVICES, MEDIA, ORDERS, AND REVIEWS ───────────
  // We will create 2 services for each child category.
  const childCategories = [
    logo,
    preview,
    presentation,
    charts,
    factors,
    activity,
    siteOptimization,
    links,
    promotion,
  ];

  // For simplicity, assign all services to Rachel and use John as the buyer/reviewer.
  for (const category of childCategories) {
    for (let i = 1; i <= 2; i++) {
      const service = await prisma.service.create({
        data: {
          title: `Сервис ${i} в ${category.name}`,
          slug: `service-${i}-${category.slug}`,
          description: `Данный сервис ${i} предлагает в ${category.name}.`,
          // Connect the service owner (Rachel) and the category.
          user: { connect: { id: rachel.id } },
          category: { connect: { id: category.id } },
          // Create a media record for this service.
          media: {
            connect: {
              id: image.id,
            },
          },
          pricingTier: {
            create: {
              price: 750,
              duration: 1440,
              volume: "1 Хостинг",
            },
          },
        },
        include: { pricingTier: true },
      });
      console.log(`Created service: ${service.title}`);

      // Create an order

      await placeOrder({
        buyer: john,
        service,
        pricingTier: service.pricingTier[0],
      });

      console.log(`Created order for service: ${service.title}`);

      // Create a review for the service (reviewer: John).
      await prisma.review.create({
        data: {
          rating: true,
          comment: "Крутая услгуа!",
          user: { connect: { id: john.id } },
          service: { connect: { id: service.id } },
        },
      });
      console.log(`Created review for service: ${service.title}`);
    }
  }

  console.log("Database has been seeded. 🌱");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
