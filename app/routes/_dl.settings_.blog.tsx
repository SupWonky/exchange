import { requireUser, requireUserId } from "~/session.server";
import { parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { Field, FieldError } from "~/components/field";
import { InputConform } from "~/components/conform/input";
import { Label } from "~/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { users } from "~/models/user.server";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { BlogSchema } from "~/constants/schemas";
import { TextareaConform } from "~/components/conform/textarea";
import { siteConfig } from "~/config/site";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);
  return { user };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: BlogSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { username, description } = submission.value;

  await users.updateBlog({
    id: userId,
    name: username,
    bio: description || null,
  });

  return submission.reply({ resetForm: true });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Настройки профиля ${data?.user.name} - ${siteConfig.name}` },
  ];
};

export default function EditBlog() {
  const { user } = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const [form, fields] = useForm({
    lastResult: navigation.state === "idle" ? lastResult : null,
    onValidate: ({ formData }) => {
      return parseWithZod(formData, { schema: BlogSchema });
    },
    shouldRevalidate: "onInput",
    defaultValue: {
      username: user.name,
      description: user.bio,
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="shadow bg-background dark:bg-muted/40 md:rounded-xl mt-12 mb-6 relative">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Link
              to=".."
              relative="path"
              className="mr-2 rounded-full hover:bg-muted p-1"
            >
              <ArrowLeft className="size-6" />
            </Link>
            <span className="font-medium">Blog</span>
          </div>
          <button
            type="submit"
            form={form.id}
            className="text-blue-500 font-medium hover:text-blue-400"
          >
            Сохранить
          </button>
        </div>

        <Form method="post" className="p-4 space-y-6" id={form.id}>
          <Field>
            <Label htmlFor={fields.username.id} className="text-sm font-medium">
              Название
            </Label>
            <div className="relative">
              <InputConform
                meta={fields.username}
                type="text"
                maxLength={50}
                autoComplete="off"
              />
              <div className="absolute right-3 top-3 text-muted-foreground text-xs  ">
                {50 - (fields.username.value?.length || 0)}
              </div>
            </div>
            {fields.username.errors && (
              <FieldError>{fields.username.errors}</FieldError>
            )}
          </Field>

          <Field>
            <Label
              htmlFor={fields.description.id}
              className="text-sm font-medium"
            >
              Описание
            </Label>

            <TextareaConform
              meta={fields.description}
              className="min-h-24"
              autoComplete="off"
            />

            {fields.description.errors && (
              <FieldError>{fields.description.errors}</FieldError>
            )}
          </Field>
        </Form>
      </div>
    </div>
  );
}
