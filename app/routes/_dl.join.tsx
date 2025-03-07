import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";

import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const joinSchema = z.object({
  email: z
    .string({ message: "Введите почту" })
    .email({ message: "Неправильный формат почты" }),
  password: z.string({ message: "Введите пароль" }),
  username: z.string({ message: "Введите имя пользователя" }),
  redirectTo: z.string().optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: joinSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { email, password, username, redirectTo } = submission.value;
  const redirectToSafe = safeRedirect(redirectTo, "/");

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return submission.reply({
      formErrors: ["Почта уже занята"],
    });
  }

  const user = await createUser(email, username, password);

  return createUserSession({
    redirectTo: redirectToSafe,
    remember: false,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Регистрация" }];

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(joinSchema),
  });

  return (
    <div className="flex flex-1 justify-center items-start">
      <Card className="w-[400px] my-48">
        <CardHeader>
          <CardTitle className="text-xl">Регистрация</CardTitle>
          {form.errors && (
            <CardDescription className="text-destructive">
              {form.errors}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <Form method="post" className="space-y-4" id={form.id}>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name={fields.email.name}
                  autoComplete="email"
                />
                {fields.email.errors && (
                  <div className="pt-1 text-sm text-destructive">
                    {fields.email.errors}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="username" className="text-sm font-medium">
                Имя пользователя
              </Label>
              <div className="mt-1">
                <Input
                  id="username"
                  name={fields.username.name}
                  type="text"
                  autoComplete="username"
                />
                {fields.username.errors && (
                  <div className="pt-1 text-sm text-destructive">
                    {fields.username.errors}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Пароль
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name={fields.password.name}
                  type="password"
                  autoComplete="current-password"
                />
                {fields.password.errors && (
                  <div className="pt-1 text-sm text-destructive">
                    {fields.password.errors}
                  </div>
                )}
              </div>
            </div>

            <input
              type="hidden"
              name={fields.redirectTo.name}
              value={redirectTo}
            />
            <Button type="submit" className="w-full">
              Создать аккаунт
            </Button>

            <div className="flex items-center justify-center">
              <div className="text-center text-sm text-gray-500">
                Уже есть аккаунт?{" "}
                <Link
                  className="text-blue-500 underline"
                  to={{
                    pathname: "/login",
                    search: searchParams.toString(),
                  }}
                >
                  Войти
                </Link>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
