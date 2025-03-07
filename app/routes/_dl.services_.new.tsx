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
import { CategoryNode, getCategoriesTree } from "~/models/category.server";
import { useFileUpload } from "./upload";
import { createService, getServiceById } from "~/models/service.server";
import { getUser, getUserId } from "~/session.server";
import { Textarea } from "~/components/ui/textarea";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";

const serviceSchema = z.object({
  title: z.string({ message: "Введите название" }),
  categoryId: z.string({ message: "Выберите рубрику" }),
  content: z.string({ message: "Введите описание" }),
  media: z.preprocess(
    (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        return val; // Let Zod handle invalid format
      }
    },
    z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          type: z.enum(["MOVIE", "IMAGE"]),
        })
      )
      .min(1, "Прикрепите медиа файлы")
  ),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/login?redirectTo=/services/new");

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: serviceSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { title, categoryId, content, media } = submission.value;

  const service = await createService({
    title,
    categoryId,
    description: content,
    media,
    userId: user.id,
  });

  return redirect(`/services/new/step-2?id=${service.id}`);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login?redirectTo=/services/new");

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  let service = undefined;
  if (typeof id === "string" && id.length !== 0) {
    service = await getServiceById({ id });
  }

  const categories = await getCategoriesTree();

  return { categories, service };
};

export default function CreateServicePage() {
  const lastResult = useActionData<typeof action>();
  const { categories, service } = useLoaderData<typeof loader>();
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(serviceSchema),
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
  const { images, submit } = useFileUpload(
    service?.media?.map((m) => ({
      name: m.name || "",
      url: m.url,
      type: m.type,
    })) ?? []
  );

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
              <MediaUpload submit={submit} defualtValue={service?.media} />

              {fields.media.errors && (
                <div className="p-1 text-sm text-destructive">
                  {fields.media.errors}
                </div>
              )}
            </div>

            <input
              name={fields.media.name}
              type="hidden"
              className="hidden"
              value={JSON.stringify(images)}
            />

            <Button>Далее</Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
