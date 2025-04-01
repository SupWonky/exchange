import { useFetcher } from "@remix-run/react";
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { useEffect } from "react";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Field, FieldError } from "../field";
import { InputConform } from "../conform/input";
import { Button } from "../ui/button";
import { JoinSchema } from "~/constants/schemas";
import * as Route from "~/routes/_dl.join";
import { useModal } from "../providers/modal-provider";

export function JoinDialog() {
  const { closeModal } = useModal();
  const fecther = useFetcher<typeof Route.action>();
  const [form, fields] = useForm({
    lastResult: fecther.data,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: JoinSchema });
    },
  });

  const isSubmitting = fecther.state === "submitting";

  useEffect(() => {
    if (fecther.data) {
      const result = fecther.data;

      if (result.status === "success") {
        closeModal();
      }
    }
  }, [fecther.data]);

  return (
    <div className="grid items-start justify-center grid-cols-[minmax(0,320px)] grid-rows-[auto,auto,1fr] min-h-96">
      <DialogHeader className="mb-8 items-center">
        <DialogTitle className="mt-8 text-2xl font-medium">
          Регистрация
        </DialogTitle>
        {form.errors && (
          <DialogDescription className=" text-destructive">
            {form.errors}
          </DialogDescription>
        )}
      </DialogHeader>

      <fecther.Form
        action="join"
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
            meta={fields.username}
            type="text"
            placeholder="Имя пользователя"
          />
          {fields.username.errors && (
            <FieldError>{fields.username.errors}</FieldError>
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

        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Загрузка..." : "Создать аккаунт"}
        </Button>

        <div className="flex justify-center items-center"></div>
      </fecther.Form>
    </div>
  );
}
