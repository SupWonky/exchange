import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaDescriptor,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { serviceManager } from "~/models/service.server";
import {
  createPricings,
  getPricingListByService,
  updatePricings,
} from "~/models/pricing.server";
import { requireUserId } from "~/session.server";
import { parseWithZod } from "@conform-to/zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useState } from "react";
import { Switch } from "~/components/ui/switch";
import { PricingSchema } from "~/constants/schemas";
import { PricingForm } from "~/components/pricing-form";
import { siteConfig } from "~/config/site";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  console.log(formData);
  const submission = parseWithZod(formData, { schema: PricingSchema });

  //console.log(submission.reply());

  if (submission.status !== "success") {
    return submission.reply();
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const service = await serviceManager.getServiceById(id);
  if (!service) {
    throw new Response("Not Found", { status: 404 });
  }

  const { pricingVariants, mode } = submission.value;

  console.log(pricingVariants[0].options);

  if (mode === "single" && pricingVariants.length !== 1) {
    return submission.reply({
      formErrors: ["В данном режиме, нужно заполнить один пакет"],
    });
  }

  if (mode === "multiple" && pricingVariants.length !== 3) {
    return submission.reply({
      formErrors: ["В данном режиме, нужно заполнить три пакета"],
    });
  }
  if (service.pricingTier.length > 0) {
    const pricingsToUpdate = pricingVariants
      .filter((item) => item.id !== undefined)
      .map((item) => ({
        ...item,
        description: item.description || null,
        id: item.id!, // asserting that id is defined
      }));

    await updatePricings({ pricings: pricingsToUpdate });
  } else {
    const pricings = pricingVariants.map((item) => ({
      ...item,
      description: item.description || null,
    }));
    await createPricings({ pricings, serviceId: service.id });
  }

  if (service.status !== "PUBLISHED") {
    await serviceManager.updateServiceStatus({
      id: service.id,
      status: "PUBLISHED",
    });
  }

  return redirect(`/services/${service.slug}`);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const service = await serviceManager.getServiceById(id);
  if (!service) {
    throw new Response("Not Found", { status: 404 });
  }

  const pricings = await getPricingListByService(service.id);

  return { pricings, service };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const res: MetaDescriptor[] = [
    { title: `Стоимость ${data?.service.title} - ${siteConfig.name}` },
    { name: "description", content: data?.service.description },
    { name: "og:description", content: data?.service.description },
    {
      name: "og:title",
      content: `${data?.service?.title} - ${siteConfig.name}`,
    },
  ];

  if (data?.service.media.at(0)) {
    res.push({
      property: "og:image",
      content: data.service.media[0].url,
    });
  }

  return res;
};

export default function CreateServicePageSetp2() {
  const { pricings } = useLoaderData<typeof loader>();
  const [mode, setMode] = useState<"single" | "multiple">(() => {
    if (pricings) {
      return pricings.length === 3 ? "multiple" : "single";
    }

    return "single";
  });

  return (
    <div className="flex flex-1 justify-center items-start">
      <div className="w-full max-w-2xl my-24">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span className="text-2xl">Стоимость и опции</span>
              <div className="flex items-center gap-2">
                <span
                  className={`${
                    mode === "single"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  1 пакет
                </span>
                <Switch
                  checked={mode === "multiple"}
                  onCheckedChange={(checked) =>
                    setMode(checked ? "multiple" : "single")
                  }
                />
                <span
                  className={`${
                    mode === "multiple"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  3 пакета
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PricingForm key={mode} mode={mode} defualtValue={pricings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
