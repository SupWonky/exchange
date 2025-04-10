import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { Check, Clock, Infinity } from "lucide-react";
import invariant from "tiny-invariant";
import { CategoryBreadcrumbs } from "~/components/category-breadcrumbs";
import { Slider } from "~/components/slider";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getCategoryTree } from "~/models/category.server";
import { placeOrder } from "~/models/order.server";
import { getPricing } from "~/models/pricing.server";
import { getServiceBySlug } from "~/models/service.server";
import { getUser } from "~/session.server";
import { getPricingVariantLabel } from "~/utils";
import { SellerInfo } from "./seller-info";
import { GuaranteeSection } from "./guarantee-section";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.slug, "Slug not found");

  const service = await getServiceBySlug({ slug: params.slug });

  if (!service) {
    throw new Response("Not Found", { status: 404 });
  }

  const categoryTree = await getCategoryTree({ path: service.category.path });
  const user = await getUser(request);

  return { service, categoryTree, user };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);

  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const pricingTierId = formData.get("pricingTierId")?.toString();

  if (!pricingTierId) return {};
  const pricingTier = await getPricing(pricingTierId);

  if (pricingTier) {
    await placeOrder({
      buyer: user,
      pricingTier,
      service: pricingTier.service,
    });
  }
  return {};
};

export default function ServicePage() {
  const { service, categoryTree, user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mt-6" />

      <div className="max-w-screen-lg mx-auto flex flex-row gap-6 flex-wrap justify-center lg:justify-between items-start">
        <div className="max-w-2xl w-full bg-background border md:rounded-lg">
          <div className="px-5 py-4">
            <h1 className="mb-4 break-all text-2xl leading-7 font-semibold">
              {service.title}
            </h1>

            <CategoryBreadcrumbs categoryTree={categoryTree} lastLink />
          </div>

          <Slider images={service.media} />

          <div className="p-5">
            <h2 className="text-xl font-semibold leading-5">Об этом кворке</h2>
            <div className="mt-4 break-words overflow-hidden space-y-4 text-sm">
              {service.description && (
                <div
                  dangerouslySetInnerHTML={{ __html: service.description }}
                />
              )}

              <div>
                <div className="font-semibold mb-1">Нужно для заказа:</div>
                <div>
                  <p>
                    От вас потребуются наброски, рисунки или картинки логотипа
                    из интернета, который необходимо отрисовать в высоком
                    качестве. Я не собираю логотип из отдельных картинок.
                    Желательно точное описание деталей и цветов.
                  </p>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2.5">
                  Фриланс услуга включает:
                </div>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>Высокое разрешение</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>Исходники</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>Количество логотипов: 1</span>
                  </li>
                  <li className="flex items-center !mt-3">
                    <span className="font-semibold mr-2">Срок выполнения:</span>{" "}
                    7 дней
                  </li>
                </ul>
              </div>

              <div className="space-y-4 mt-4">
                <div>
                  <span className="font-semibold">Вид: </span>
                  Новый логотип
                </div>
                <div>
                  <span className="font-semibold">Стиль: </span>
                  Плоский
                </div>
                <div>
                  <span className="font-semibold">Создание логотипа: </span>
                  По эскизу
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl lg:max-w-xs w-full overflow-hidden space-y-6">
          <div className="bg-background border md:rounded-lg overflow-hidden">
            {service.pricingTier.length === 1 ? (
              <Form>
                <input
                  name="pricingTierId"
                  value={service.pricingTier[0].id}
                  type="hidden"
                />
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-green-600">
                      3 000 ₽
                    </span>
                    <span className="text-base font-semibold">
                      Детали заказа
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <Infinity className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Доработка до 100% результата
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">7 дней на выполнение</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Обычно выполняет за 5 дней
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Высокое разрешение</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Исходники</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">До 1 логотипа</span>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full mt-4">
                    Заказать за {service.pricingTier[0].price} ₽
                  </Button>
                </div>

                <div>
                  <div className="text-sm leading-8 font-semibold px-4 pt-4 pb-1">
                    Добавить к заказу
                  </div>

                  <div className="divide-y">
                    <Label
                      htmlFor="1"
                      variant="button"
                      className="has-[:checked]:bg-primary/10 flex flex-row gap-2 px-4 py-5 hover:text-foreground"
                    >
                      <Checkbox id="1" />
                      <span>Эффект свечения</span>
                      <span className="ml-auto font-semibold text-primary">
                        500 ₽
                      </span>
                    </Label>
                    <Label
                      htmlFor="2"
                      variant="button"
                      className="has-[:checked]:bg-primary/10 flex flex-row gap-2 px-4 py-5 hover:text-foreground"
                    >
                      <Checkbox id="2" />
                      <span>Отрисовка персонажа</span>
                      <span className="ml-auto font-semibold text-primary">
                        500 ₽
                      </span>
                    </Label>

                    <Label
                      htmlFor="3"
                      variant="button"
                      className="has-[:checked]:bg-primary/10 flex flex-row gap-2 px-4 py-5 hover:text-foreground"
                    >
                      <Checkbox id="3" />
                      <span>Объем</span>
                      <span className="ml-auto font-semibold text-primary">
                        500 ₽
                      </span>
                    </Label>
                  </div>
                </div>
              </Form>
            ) : (
              <Tabs
                defaultValue={service.pricingTier[0].variant}
                className="w-full"
              >
                <TabsList className="border-b w-full rounded-none bg-background py-0 px-6 items-stretch">
                  {service.pricingTier.map((item) => (
                    <TabsTrigger
                      className="flex-1 text-base transition-none data-[state=active]:shadow-none rounded-none data-[state=active]:text-primary border-primary data-[state=active]:border-b-2"
                      key={item.id}
                      value={item.variant}
                    >
                      {getPricingVariantLabel(item.variant)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {service.pricingTier.map((item) => (
                  <TabsContent
                    className="px-6 pb-4"
                    key={item.id}
                    value={item.variant}
                  >
                    {item.options.map((option) => (
                      <div className="flex justify-between" key={option.name}>
                        <div>{option.name}</div>
                        {option.type === "BOOLEAN" ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <span>{option.stringValue}</span>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <div>Срок выполнения</div>
                      <div className="font-medium">
                        {item.duration / 60 / 24} дней
                      </div>
                    </div>
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (!user) {
                          e.preventDefault();
                          navigate("/login");
                          return;
                        }

                        if (user.balance < item.price) {
                          e.preventDefault();
                          navigate("?rmodal=balance");
                          return;
                        }
                      }}
                    >
                      <input
                        name="pricingTierId"
                        value={item.id}
                        type="hidden"
                      />
                      <Button type="submit" className="w-full">
                        Заказать за {item.price} ₽
                      </Button>
                    </Form>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <GuaranteeSection />

          <SellerInfo name={service.user.email} reciverId={service.userId} />
        </div>
      </div>
    </div>
  );
}
