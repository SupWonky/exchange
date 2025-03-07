import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const loginSchema = z.object({
  email: z
    .string({ message: "Введите почту" })
    .email({ message: "Неправильный формат почты" }),
  password: z.string({ message: "Введите пароль" }),
  remember: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  console.log(userId);
  if (userId) return redirect("/");
  return {};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: loginSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { redirectTo, email, password, remember } = submission.value;
  const redirectToSafe = safeRedirect(redirectTo, "/");
  const user = await verifyLogin(email, password);

  if (!user) {
    return submission.reply({
      formErrors: ["Неправильный логин или пароль"],
    });
  }

  return createUserSession({
    redirectTo: redirectToSafe,
    remember: remember ?? false,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Войти" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(loginSchema),
  });

  return (
    <div className="flex flex-1 justify-center items-start">
      <Card className="w-[400px] my-48">
        <CardHeader>
          <CardTitle className="text-xl">Вход</CardTitle>
          {form.errors && (
            <CardDescription className="text-destructive">
              {form.errors}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4" id={form.id}>
            <div>
              <Label htmlFor="email" className="block text-sm">
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
              Войти
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox id="remember" name={fields.remember.name} />
                <Label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Запомнить
                </Label>
              </div>
              <div className="text-center text-sm text-gray-500">
                Нету аккаунта?{" "}
                <Link
                  className="text-blue-500 underline"
                  to={{
                    pathname: "/join",
                    search: searchParams.toString(),
                  }}
                >
                  Регистрация
                </Link>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
