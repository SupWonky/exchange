import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { PlusCircle, History, CreditCard, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { User } from "@prisma/client";
import { SubmissionResult, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { popupSchema } from "~/constants/schemas";

export function BalanceModal({ user }: { user: User }) {
  const fetcher = useFetcher();
  const [form, fields] = useForm({
    lastResult: fetcher.data as SubmissionResult<string[]> | undefined,
    constraint: getZodConstraint(popupSchema),
    defaultValue: {
      amount: 0,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: popupSchema });
    },
    onSubmit() {
      setOpen(false);
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const [open, setOpen] = useState(true);
  const [isTopUpMode, setIsTopUpMode] = useState(false);

  const isSubmitting = fetcher.state !== "idle";

  const handleTopUp = () => {
    setIsTopUpMode(true);
  };

  const handleCancelTopUp = () => {
    setIsTopUpMode(false);
  };

  // const handleSubmitTopUp = (event: React.FormEvent) => {
  //   event.preventDefault();

  //   fetcher.submit({ amount }, { method: "post", action: "/balance" });

  //   // Simulating successful response
  //   setTimeout(() => {
  //     setSuccessMessage(`Баланс успешно пополнен на ${amount} ₽`);
  //     setIsTopUpMode(false);
  //     setAmount(0);

  //     // Clear success message after 3 seconds
  //     setTimeout(() => {
  //       setSuccessMessage("");
  //     }, 3000);
  //   }, 1000);
  // };

  // Sample transaction history data - in a real app, this would come from API/props
  const transactions = [
    {
      id: 1,
      type: "topup",
      description: "Пополнение",
      amount: 1000,
      date: "15 фев 2025, 14:32",
    },
    {
      id: 2,
      type: "payment",
      description: "Оплата заказа #12345",
      amount: -750,
      date: "12 фев 2025, 10:15",
    },
    {
      id: 3,
      type: "topup",
      description: "Пополнение",
      amount: 2000,
      date: "5 фев 2025, 18:43",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Баланс</DialogTitle>
          <DialogDescription>
            Управление балансом вашего аккаунта
          </DialogDescription>
        </DialogHeader>

        {/* {successMessage && (
          <Alert className="border-green-200 bg-green-50 mb-4">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Успешно</AlertTitle>
            <AlertDescription className="text-green-700">
              {successMessage}
            </AlertDescription>
          </Alert>
        )} */}

        {!isTopUpMode ? (
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="balance">Текущий баланс</TabsTrigger>
              <TabsTrigger value="history">История операций</TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="mt-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{user.balance} ₽</CardTitle>
                  <CardDescription>
                    Доступные средства на вашем счете
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    className="w-full flex items-center gap-2"
                    onClick={handleTopUp}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Пополнить баланс
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>История операций</CardTitle>
                  <CardDescription>
                    Последние транзакции по вашему счету
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.date}
                          </p>
                        </div>
                        <p
                          className={
                            transaction.amount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.amount > 0
                            ? `+${transaction.amount}`
                            : transaction.amount}{" "}
                          ₽
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      Нет истории операций
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button variant="outline" className="w-full mt-2">
                    <History className="h-4 w-4 mr-2" />
                    Показать все операции
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <fetcher.Form
            method="post"
            action="/balance"
            id={form.id}
            onSubmit={form.onSubmit}
          >
            <Card>
              <CardHeader>
                <CardTitle>Пополнение баланса</CardTitle>
                <CardDescription>
                  Введите сумму для пополнения баланса
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={fields.amount.name}>
                    Сумма пополнения (₽)
                  </Label>
                  <Input
                    id={fields.amount.name}
                    name={fields.amount.name}
                    type="number"
                    defaultValue={fields.amount.initialValue}
                  />
                  <p className="text-sm text-gray-500">
                    Минимальная сумма пополнения: 100 ₽
                  </p>
                </div>

                {fields.amount.errors && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>{fields.amount.errors}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex justify-between flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelTopUp}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button type="submit">
                  {isSubmitting ? "Обработка..." : "Пополнить"}
                </Button>
              </CardFooter>
            </Card>
          </fetcher.Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
