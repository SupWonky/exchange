import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Form, Link } from "@remix-run/react";
import { Star } from "lucide-react";
import { TextareaConform } from "~/components/conform/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { ConversationSchema } from "~/constants/schemas";

type SellerInfoProps = {
  name: string;
  reciverId: string;
};

export function SellerInfo({ name, reciverId }: SellerInfoProps) {
  const seller = {
    fullName: "Андрей",
    level: "Бывалый фрилансер плюс",
    role: "Дизайн",
    rating: 5.0,
    completedOrders: 2984,
    positiveReviews: 1101,
    negativeReviews: 3,
    ordersInProgress: 1,
  };

  return (
    <div className="bg-card border rounded-lg mb-6 p-4 md:rounded-lg">
      <div className="flex">
        <Link to={`/user/${name}`} className="shrink-0 mr-3">
          <Avatar className="h-14 w-14 border">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-primary/10">
              {name.at(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex flex-col">
          <Link className="hover:text-indigo-500" to={`/user/${name}`}>
            {name}
          </Link>
          <Link className="text-sm hover:text-indigo-500" to={`/user/${name}`}>
            {seller.fullName}
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <StartConversationDialog reciverId={reciverId} />
      </div>

      <div className="text-sm">
        <Separator className="my-4" />

        <div className="flex flex-row justify-between items-center">
          Репутация
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-transparent fill-yellow-500" />
            <span className="font-semibold">{seller.rating}</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-row justify-between items-center">
          Выполнено заказов
          <span>{seller.completedOrders}</span>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-row justify-between items-center">
          Оценки в заказах
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>{seller.positiveReviews}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>{seller.negativeReviews}</span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-row justify-between items-center">
          Заказов в работе
          <span>{seller.ordersInProgress}</span>
        </div>

        <Separator className="my-4" />
      </div>
    </div>
  );
}

function StartConversationDialog({ reciverId }: { reciverId: string }) {
  const [form, fields] = useForm({
    id: "start-conversation-form",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ConversationSchema });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          Связаться с продавцом
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex justify-between p-6 pb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Отправить сообщение</h3>
              <p className="text-sm text-muted-foreground">
                Напишите сообщение для ANDREWNK чтобы начать диалог
              </p>
            </div>
            <DialogClose className="rounded-full opacity-70 transition-opacity hover:opacity-100 self-start">
              <Cross1Icon className="h-5 w-5" />
            </DialogClose>
          </div>

          {/* Form Content */}
          <Form
            action="/chat/new"
            method="post"
            className="flex flex-col gap-4 p-6 pt-0"
            id={form.id}
          >
            <input
              className="sr-only"
              value={reciverId}
              name="reciverId"
              readOnly
            />
            <div className="space-y-4">
              <TextareaConform
                meta={fields.initMessage}
                placeholder="Напишите ваше сообщение здесь..."
                rows={4}
                className="min-h-[120px] resize-none"
              />
              {fields.initMessage.errors && (
                <p className="text-sm font-medium text-destructive">
                  {fields.initMessage.errors}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <Button type="submit">Отправить</Button>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
