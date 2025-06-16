import { useEffect, useState } from "react";
import { useFetcher, useNavigation } from "@remix-run/react";
import { PlusCircle, History } from "lucide-react";
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { User } from "@prisma/client";
import { action } from "~/routes/api.v1.popup";
import { siteConfig } from "~/config/site";

export function BalanceModal({ user }: { user: User }) {
  const fetcher = useFetcher<typeof action>();
  const navigation = useNavigation();
  const [isTopUpMode, setIsTopUpMode] = useState(false);
  const isSubmitting = navigation.state !== "idle";

  const handleTopUp = () => {
    setIsTopUpMode(true);
  };

  const handleCancelTopUp = () => {
    setIsTopUpMode(false);
  };

  useEffect(() => {
    if (fetcher.data) {
      if ("transaction" in fetcher.data) {
        const transaction = fetcher.data.transaction;

        const form = document.createElement("form");
        form.method = "post";
        form.action = "https://demo.paykeeper.ru/create";

        const fields = {
          sum: transaction.amount.toString(),
          user_result_callback: `${siteConfig.serverUrl}/payment`,
          clientid: transaction.id,
        };

        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.name = key;
          input.value = value;
          input.type = "hidden";
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      }
    }
  }, [fetcher.data]);

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
    <div className="grid items-start justify-center grid-cols-[minmax(0,320px)] grid-rows-[auto,auto,1fr] min-h-96">
      <DialogHeader className="mb-8 items-center">
        <DialogTitle className="mt-8 text-2xl font-medium">Баланс</DialogTitle>
        <DialogDescription>
          Управление балансом вашего аккаунта
        </DialogDescription>
      </DialogHeader>

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
                        <p className="font-medium">{transaction.description}</p>
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
        <fetcher.Form method="post" action="/api/v1/popup">
          <Card>
            <CardHeader>
              <CardTitle>Пополнение баланса</CardTitle>
              <CardDescription>
                Введите сумму для пополнения баланса
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sum">Сумма пополнения (₽)</Label>
                <Input
                  id="sum"
                  name="sum"
                  type="number"
                  defaultValue={0}
                  min={100}
                />
                <p className="text-sm text-gray-500">
                  Минимальная сумма пополнения: 100 ₽
                </p>
              </div>
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
    </div>
  );
}
