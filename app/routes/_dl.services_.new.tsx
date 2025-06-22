import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useForm } from "@conform-to/react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { CategorySelector } from "~/components/category-selector";
import { MediaUpload } from "~/components/media-upload";
import { TextInput } from "~/components/text-input";
import { Button } from "~/components/ui/button";
import { CategoryNode, categoryManager } from "~/models/category.server";
import { serviceManager } from "~/models/service.server";
import { getUserId, requireUserId } from "~/session.server";
import { Textarea } from "~/components/ui/textarea";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { ServiceSchema } from "~/constants/schemas";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: ServiceSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const { title, categoryId, content, media } = submission.value;

  let service = undefined;
  if (id) {
    service = await serviceManager.getServiceById(id);

    if (!service) {
      throw new Response("Not Found", { status: 404 });
    }

    await serviceManager.updateService({
      id,
      title,
      categoryId,
      description: content,
      media,
    });
  } else {
    service = await serviceManager.createService({
      title,
      categoryId,
      description: content,
      media,
      userId,
    });
  }

  return redirect(`/services/new/step-2?id=${service.id}`);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login?redirectTo=/services/new");

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  let service = undefined;
  if (typeof id === "string" && id.length !== 0) {
    service = await serviceManager.getServiceById(id);
  }

  const categories = await categoryManager.getCategoriesTree();

  return { categories, service };
};

export default function CreateServicePage() {
  const lastResult = useActionData<typeof action>();
  const { categories, service } = useLoaderData<typeof loader>();
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(ServiceSchema),
    defaultValue: {
      title: service?.title,
      categoryId: service?.categoryId,
      content: service?.description,
      media: service?.media.map((item) => ({
        name: item.name,
        url: item.url,
        type: item.type,
      })),
    },
  });

  return (
    <div className="flex flex-1 justify-center items-start">
      <Card className="w-full max-w-2xl my-24 rounded-none md:rounded-xl">
        <CardHeader className="text-2xl">Основное</CardHeader>
        {form.errors && (
          <CardDescription className="text-destructive">
            {form.errors}
          </CardDescription>
        )}

        <CardContent>
          <Form method="post" className="flex flex-col gap-y-4" id={form.id}>
            <TextInput
              className="h-14 lg:text-xl font-medium"
              limit={100}
              title="Название"
              name={fields.title.name}
              defaultValue={fields.title.initialValue}
              errors={fields.title.errors}
            />

            <div>
              <Label className="text-base font-medium">Описание</Label>

              <div className="mt-1">
                <Textarea
                  placeholder="Описание услуги..."
                  name={fields.content.name}
                  defaultValue={fields.content.initialValue}
                />

                {fields.content.errors && (
                  <div className="p-1 text-sm text-destructive">
                    {fields.content.errors}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Рубрика</Label>

              <div className="mt-1">
                <CategorySelector
                  categories={categories}
                  name={fields.categoryId.name}
                  initValue={service?.category as CategoryNode}
                />
                {fields.categoryId.errors && (
                  <div className="p-1 text-sm text-destructive">
                    {fields.categoryId.errors}
                  </div>
                )}
              </div>
            </div>

            <div>
              <MediaUpload
                name={fields.media.name}
                defualtValue={service?.media}
              />

              {fields.media.errors && (
                <div className="p-1 text-sm text-destructive">
                  {fields.media.errors}
                </div>
              )}
            </div>

            <Button>Далее</Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
