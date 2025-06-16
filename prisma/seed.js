import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { formatSlug } from "~/lib/utils";
import { placeOrder } from "~/models/order.server";
import { parseArgs, sleep } from "./utils";
import { recaclStats } from "~/db.server";

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
  await prisma.password.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.media.deleteMany({});

  // ─── CREATE USERS ─────────────────────────────────────────
  const rachelPassword = await bcrypt.hash("racheliscool", 10);
  const johnPassword = await bcrypt.hash("johnspassword", 10);
  const emmaPassword = await bcrypt.hash("emmaspassword", 10);

  const rachel = await prisma.user.create({
    data: {
      name: "machine",
      email: "rachel@remix.run",
      password: { create: { hash: rachelPassword } },
      balance: 1550000,
      avatar: {
        create: {
          type: "IMAGE",
          url: "https://static.vecteezy.com/system/resources/previews/049/423/252/non_2x/a-cool-mysterious-and-powerful-blue-masked-ninja-character-avatar-in-a-hooded-cloak-perfect-for-gaming-channels-esports-teams-and-social-media-profiles-free-vector.jpg",
        },
      },
    },
  });

  const john = await prisma.user.create({
    data: {
      name: "megajhon",
      email: "john@example.com",
      password: { create: { hash: johnPassword } },
      balance: 1500000,
      avatar: {
        create: {
          type: "IMAGE",
          url: "https://img.freepik.com/free-vector/hand-drawn-nft-style-ape-illustration_23-2149622021.jpg?semt=ais_hybrid&w=740",
        },
      },
    },
  });

  const emma = await prisma.user.create({
    data: {
      name: "emma",
      email: "emma@example.com",
      password: { create: { hash: emmaPassword } },
      balance: 1500000,
      avatar: {
        create: {
          type: "IMAGE",
          url: "https://img.freepik.com/premium-vector/abstract-avatar-icon-isometric-abstract-avatar-vector-icon-web-design-isolated-white-background_98402-22848.jpg",
        },
      },
    },
  });

  console.log("Created users:");

  console.log(` - ${rachel.email}`);
  console.log(` - ${john.email}`);
  console.log(` - ${emma.email}`);

  console.log("Database has been seeded. 🌱");
}

async function getServices(categoryPath, limit = 10) {
  // const proxy = await getProxy();

  // if (!proxy) {
  //   throw new Error("Cant found working proxy");
  // }

  // console.log(proxy);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    //args: [`--proxy-server="http=${proxy}"`],
  });
  const page = await browser.newPage();
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

      await sleep(1000 + Math.random() * 5000);
    }
  } catch (err) {
    console.error("Scraping failed:", err.message);
  } finally {
    await browser.close();
  }

  return services.filter((value) => !!value.image.url && !!value.description);
}

async function getCategories() {
  // const proxy = await getProxy();

  // if (!proxy) {
  //   throw new Error("Cant found working proxy");
  // }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    //args: [`--proxy-server=http://${proxy}`],
  });
  const page = await browser.newPage();
  await page.goto("https://kwork.ru/categories", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".all-categories");

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

  // Convert tree structure to flat array with parent relationships
  const flattenCategories = (categories, parent) => {
    return categories.flatMap((category) => {
      if (!category) return [];
      const id = createId();
      const path = parent ? `${parent.path}/${id}` : id;

      const res = {
        id,
        name: category.name,
        slug: category.slug,
        path,
        parentId: parent?.id,
        url: category.url,
        image: {
          url: undefined,
        },
        level: path.split("/").length,
      };

      return [res, ...flattenCategories(category.children, res)];
    });
  };

  const flattenedCategories = flattenCategories(categoryTree);

  for (const category of flattenedCategories) {
    if (category.level > 2) {
      continue;
    }

    await page.goto(`https://kwork.ru/categories${category.url}`, {
      waitUntil: "domcontentloaded",
    });

    const imageUrl = await page.evaluate(() => {
      return document.querySelector('meta[property="og:image"]').content;
    });

    category.image.url = imageUrl;

    await sleep(1000 + Math.random() * 5000);
  }

  await browser.close();

  return flattenedCategories;
}

async function createCategories(parsedCategoires) {
  const categories = [];
  for (const category of parsedCategoires) {
    let imageId = undefined;

    if (category.image.url) {
      const image = await prisma.media.create({
        data: {
          url: category.image.url,
          type: "IMAGE",
        },
      });
      imageId = image.id;
    }

    categories.push({
      id: category.id,
      name: category.name,
      url: category.url,
      slug: category.slug,
      path: category.path,
      parentId: category.parentId,
      imageId,
    });
  }

  return await prisma.category.createManyAndReturn({
    data: categories,
  });
}

async function seedCategories() {
  const parsedCategoires = await getCategories();
  await createCategories(parsedCategoires);
}

async function seedServices() {
  const categories = await prisma.category.findMany();
  const users = await prisma.user.findMany();

  for (const category of categories) {
    const level = category.path.split("/").length;
    if (level === 2) {
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
            status: "PUBLISHED",
          },
          include: { pricingTier: true },
        });

        await placeOrder({
          buyer: users[(userIdx + 1) % users.length],
          service,
          pricingTier: service.pricingTier[0],
        });
      }
    }
  }
}

const REVIEW_TEMPLATES = [
  { comment: "Отличный сервис, вернусь ещё!", recommend: true },
  { comment: "Крутая услуга!", recommend: true },
  { comment: "Не понравилось, плохо организовано.", recommend: false },
  { comment: "Быстро и качественно.", recommend: true },
  { comment: "Цены немного высокие, но сервис отличный.", recommend: true },
  { comment: "Очень вежливый персонал.", recommend: true },
  { comment: "Расстроен уровнем поддержки.", recommend: false },
  { comment: "Превзошли все ожидания!", recommend: true },
  { comment: "Не порадовало соотношение цена/качество.", recommend: false },
  { comment: "Буду рекомендовать друзьям!", recommend: true },
];

async function seedReviews() {
  await prisma.review.deleteMany();

  const services = await prisma.service.findMany();
  const users = await prisma.user.findMany();

  for (const service of services) {
    const user = users.filter((item) => item.id !== service.userId)[
      Math.floor(Math.random() * (users.length - 2))
    ];

    const reviews = Array.from({
      length: Math.floor(Math.random() * REVIEW_TEMPLATES.length),
    }).map(() => {
      const { recommend, comment } =
        REVIEW_TEMPLATES[
          Math.floor(Math.random() * (REVIEW_TEMPLATES.length - 1))
        ];

      return {
        recommend,
        comment,
        userId: user.id,
        serviceId: service.id,
      };
    });

    await prisma.review.createMany({
      data: reviews,
    });
  }

  for (const user of users) {
    await prisma.$transaction(async (tx) => {
      await recaclStats(user.id, tx);
    });
  }
}

const raw = process.argv.slice(2);
const args = parseArgs(raw);

try {
  if (args.m === "category") {
    seedCategories();
  } else if (args.m === "service") {
    seedServices();
  } else if (args.m === "review") {
    seedReviews();
  } else {
    seed();
  }
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
