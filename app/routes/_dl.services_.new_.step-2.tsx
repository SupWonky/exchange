import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { getServiceById, updateServiceStatus } from "~/models/service.server";
import {
  createPricings,
  getPricingListByService,
  updatePricings,
} from "~/models/pricing.server";
import { getUserId } from "~/session.server";
import { parseWithZod } from "@conform-to/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useState } from "react";
import { Switch } from "~/components/ui/switch";
import { pricingSchema } from "~/constants/schemas";
import { PricingForm } from "~/components/pricing-form";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: pricingSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return redirect("/services/new");
  }

  const service = await getServiceById({ id });
  if (!service) {
    return redirect("/services/new");
  }

  const { pricingVariants, mode } = submission.value;

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
    await updateServiceStatus({ id: service.id, status: "PUBLISHED" });
  }

  return redirect(`/services/${service.slug}`);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login?redirectTo=/services/new/setp-2");

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return redirect("/services/new");
  }

  const pricings = await getPricingListByService(id);

  if (pricings.length === 0) {
    return { pricings: undefined };
  }

  return { pricings };
};

export default function CreateServicePageSetp2() {
  const { pricings } = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const [mode, setMode] = useState<"single" | "multiple">(() => {
    if (pricings) {
      return pricings.length === 3 ? "multiple" : "single";
    }

    return "single";
  });
  const [formErrors, setFormErrors] = useState<string[] | undefined>(undefined);

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
            {formErrors && (
              <CardDescription className="text-destructive">
                {formErrors}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <PricingForm
              key={mode}
              mode={mode}
              lastResult={lastResult}
              onChangeFormErrors={setFormErrors}
              defualtValue={pricings}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
