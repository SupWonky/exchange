import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { formatSlug } from "~/lib/utils";
import { userAgents } from "~/constants";
import { getRandomIndex } from "~/utils";
import { getProxy } from "~/lib/proxy";

const prisma = new PrismaClient();

puppeteer.use(StealthPlugin());

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
      balance: 15000,
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
      balance: 10000,
    },
  });

  const users = [rachel, emma, john];

  console.log("Created users:");

  console.log(` - ${rachel.email}`);
  console.log(` - ${john.email}`);
  console.log(` - ${emma.email}`);

  // ─── PARSE AND CREATE CATEGORIES ──────────────────────────────────────
  // Create two root categories.

  const image = await prisma.media.create({
    data: {
      type: "IMAGE",
      url: "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80",
    },
  });

  console.log("Created categories");

  // ─── CREATE SERVICES, MEDIA, ORDERS, AND REVIEWS ───────────
  // We will create 2 services for each child category.

  const parsedCategoires = await getCategories();
  const categories = await prisma.category.createManyAndReturn({
    data: parsedCategoires,
  });

  // For simplicity, assign all services to Rachel and use John as the buyer/reviewer.
  for (const category of categories) {
    const pathParts = category.path.split("/");
    const level = pathParts.length;
    if (level === 3) {
      const parsedServices = await getServices(category.url);
      const userIdx = Math.floor(Math.random() * (users.length - 1));

      for (const srv of parsedServices) {
        const service = await prisma.service.create({
          data: {
            title: srv.title,
            slug: formatSlug(srv.title),
            description: srv.description,
            requiredInfo: srv.requiredInfo,
            userId: users[userIdx].id,
            categoryId: category.id,
            media: {
              create: {
                type: "IMAGE",
                url: srv.image.url,
              },
            },
            pricingTier: {
              create: {
                price: srv.price,
                duration: 1440,
                volume: "тест",
              },
            },
          },
          include: { pricingTier: true },
        });

        //console.log(`Created service: ${service.title}`);

        // Create an order

        // await placeOrder({
        //   buyer: users[(userIdx + 1) % users.length],
        //   service,
        //   pricingTier: service.pricingTier[0],
        // });

        //console.log(`Created order for service: ${service.title}`);

        // Create a review for the service (reviewer: John).
        // await prisma.review.create({
        //   data: {
        //     rating: true,
        //     comment: "Крутая услгуа!",
        //     user: { connect: { id: john.id } },
        //     service: { connect: { id: service.id } },
        //   },
        // });
        //console.log(`Created review for service: ${service.title}`);
      }
    }
  }

  console.log("Database has been seeded. 🌱");
}

async function getServices(categoryPath, limit = 10) {
  const proxy = await getProxy();

  if (!proxy) {
    throw new Error("Cant found working proxy");
  }

  console.log(proxy);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [`--proxy-server="http=${proxy}"`],
  });
  const page = await browser.newPage();
  await page.setUserAgent(userAgents[getRandomIndex(userAgents.length)]);
  await new Promise((resolve) => setTimeout(resolve, 50000));
  const services = [];

  try {
    const baseUrl = "https://kwork.ru/categories";
    await page.goto(`${baseUrl}${categoryPath}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector("#catalog-cards");

    // Extract all service previews
    const pageServices = await page.evaluate((max) => {
      const els = Array.from(
        document.querySelectorAll(".kwork-card-item__wrapper")
      ).slice(0, max);
      return els.map((wrapper) => {
        const get = (selector, attr = "innerText") =>
          wrapper.querySelector(selector)?.[attr]?.trim() || null;
        return {
          title: get(".kwork-card-item__title span"),
          url: get(".kwork-card-item__cover a.ispinner-container", "href"),
          price: Number(get(".price-wrap__value")?.replace(/[^0-9]/g, "")),
          // rating: get(".kwork-card-item__rating-number"),
          // ratingCount: get(".kwork-card-item__rating-count")?.replace(
          //   /[()]/g,
          //   ""
          // ),
        };
      });
    }, limit);
    services.push(...pageServices);

    // Process service details with concurrency limit
    const CONCURRENCY = 5;
    for (let i = 0; i < services.length; i += CONCURRENCY) {
      const batch = services.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (svc) => {
          const servicePage = await browser.newPage();
          try {
            await servicePage.goto(svc.url, {
              waitUntil: "domcontentloaded",
            });
            await servicePage.waitForSelector("div#js-kwork-view");

            const details = await servicePage.evaluate(() => {
              const sel = (selector, attr = "textContent") =>
                document.querySelector(selector)?.[attr]?.trim() || null;
              const likes = sel("span.total-like-count");
              const description = sel("#description-text");
              // const files = Array.from(
              //   document.querySelectorAll(".files-list__title")
              // ).map((el) => el.textContent.trim());

              const requiredInfo = sel("#requiredInfo-text");

              const imageUrl = sel("div.sliderItem img", "src");

              // Theme
              let theme = null;
              const themeDiv = Array.from(
                document.querySelectorAll("div")
              ).find((d) => d.textContent.startsWith("Тематика:"));
              if (themeDiv)
                theme = themeDiv.textContent.replace("Тематика:", "").trim();

              if (!imageUrl || !description) {
                throw new Error();
              }

              return {
                likes,
                description,
                requiredInfo,
                theme,
                image: {
                  url: imageUrl,
                },
              };
            });

            Object.assign(svc, details);
          } catch (e) {
            console.error(`Error parsing ${svc.url}:`, e.message);
          } finally {
            await servicePage.close();
          }
        })
      );

      // Throttle between batches
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
    }
  } catch (err) {
    console.error("Scraping failed:", err.message);
  } finally {
    await browser.close();
  }

  return services;
}

async function getCategories() {
  const proxy = await getProxy();
  console.log(proxy);

  if (!proxy) {
    throw new Error("Cant found working proxy");
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [`--proxy-server=http://${proxy}`],
  });
  const page = await browser.newPage();
  await new Promise((resolve) => setTimeout(resolve, 50000))
  await page.goto("https://kwork.ru/categories", { waitUntil: "networkidle0" });

  // Extract category data directly in browser context
  const categoryTree = await page.evaluate(() => {
    const parseCategory = (element) => {
      const anchor = element.querySelector(".js-categories-collapse-header a");
      if (!anchor) return null;

      const slug = anchor.href.split("/").pop();
      const name = anchor.textContent?.trim() || "";

      const children = Array.from(
        element.querySelector(".js-categories-collapse-body")?.children || []
      )
        .map((child) => parseCategory(child))
        .filter(Boolean);

      return {
        name,
        slug,
        children,
        url: anchor.href.replace("https://kwork.ru/categories", ""),
      };
    };

    return Array.from(
      document
        .querySelector(".all-categories")
        .querySelectorAll(".categories-item")
    )
      .map((category) => parseCategory(category))
      .filter(Boolean);
  });

  await browser.close();

  // Convert tree structure to flat array with parent relationships
  const flattenCategories = (categories, parent) => {
    return categories.flatMap((category) => {
      if (!category) return [];
      const id = createId();

      const res = {
        id,
        name: category.name,
        slug: category.slug,
        path: parent ? `${parent.path}/${id}` : id,
        parentId: parent?.id,
        url: category.url,
      };

      return [res, ...flattenCategories(category.children, res)];
    });
  };

  return flattenCategories(categoryTree);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
