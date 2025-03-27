import { Link, useFetcher, useSearchParams } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useEffect, useState } from "react";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Field, FieldError } from "../field";
import { Label } from "../ui/label";
import { InputConform } from "../conform/input";
import { Button } from "../ui/button";
import { CheckboxConform } from "../conform/checkbox";
import { LoginSchema } from "~/constants/schemas";
import * as Route from "~/routes/_dl.login";
import { useModal } from "../providers/modal-provider";

export function LoginDialog() {
  const { setOpen, openModal } = useModal();
  const fecther = useFetcher<typeof Route.action>();
  const [form, fields] = useForm({
    lastResult: fecther.data,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginSchema });
    },
    shouldRevalidate: "onInput",
  });

  console.log(fecther.data);

  useEffect(() => {
    if (fecther.data) {
      const result = fecther.data;
      console.log(result);
      if (result.status === "success") {
        console.log("closing");
        setOpen(false);
      }
    }
  }, [fecther.data]);

  return (
    <div className="grid items-start justify-center grid-cols-[minmax(0,320px)] grid-rows-[auto,auto,1fr] min-h-96">
      <DialogHeader className="mb-8 items-center">
        <DialogTitle className="mt-8 text-2xl font-medium">Вход</DialogTitle>
        {form.errors && (
          <DialogDescription className=" text-destructive">
            {form.errors}
          </DialogDescription>
        )}
      </DialogHeader>

      <fecther.Form
        action="login"
        method="post"
        className="space-y-4"
        id={form.id}
      >
        <Field>
          <InputConform meta={fields.email} type="text" placeholder="Email" />
          {fields.email.errors && (
            <FieldError>{fields.email.errors}</FieldError>
          )}
        </Field>

        <Field>
          <InputConform
            meta={fields.password}
            type="password"
            placeholder="Пароль"
          />
          {fields.password.errors && (
            <FieldError>{fields.password.errors}</FieldError>
          )}
        </Field>

        <Button className="w-full">Войти</Button>

        <div className="flex justify-between items-center">
          <Field>
            <div className="flex flex-row gap-2">
              <CheckboxConform meta={fields.remember} />

              <Label
                htmlFor={fields.remember.id}
                className="block text-sm text-gray-900"
              >
                Запомнить
              </Label>

              {fields.remember.errors && (
                <FieldError>{fields.remember.errors}</FieldError>
              )}
            </div>
          </Field>

          <div className="text-center text-sm text-gray-500">
            Нету аккаунта?{" "}
            <Button
              type="button"
              variant="link"
              className="px-0"
              onClick={() => openModal("auth/join")}
            >
              Регистрация
            </Button>
          </div>
        </div>
      </fecther.Form>
    </div>
  );
}
