import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { Check } from "lucide-react";
import invariant from "tiny-invariant";
import { CategoryBreadcrumbs } from "~/components/category-breadcrumbs";
import { Slider } from "~/components/slider";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getCategoryTree } from "~/models/category.server";
import { placeOrder } from "~/models/order.server";
import { getPricing } from "~/models/pricing.server";
import { getServiceBySlug } from "~/models/service.server";
import { getUser } from "~/session.server";
import { getPricingVariantLabel } from "~/utils";

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
  const lastResult = useActionData<typeof action>();

  console.log(lastResult);

  return (
    <div>
      <div className="mt-6" />

      <div className="max-w-screen-lg mx-auto flex flex-row gap-6 flex-wrap justify-center lg:justify-between items-start">
        <div className="max-w-2xl w-full bg-background border md:rounded-lg">
          <div className="px-5 py-4">
            <h1 className="mb-4 break-all text-2xl font-semibold">
              {service.title}
            </h1>

            <CategoryBreadcrumbs categoryTree={categoryTree} lastLink />
          </div>

          <Slider images={service.media} />

          <div className="p-4">{service.description}</div>
        </div>

        <div className="max-w-2xl lg:max-w-xs w-full overflow-hidden space-y-6">
          <div className="bg-background border md:rounded-lg overflow-hidden">
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
                    <input name="pricingTierId" value={item.id} type="hidden" />
                    <Button type="submit" className="w-full">
                      Заказать за {item.price} ₽
                    </Button>
                  </Form>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="bg-background border md:rounded-lg h-24"></div>
        </div>
      </div>
    </div>
  );
}
