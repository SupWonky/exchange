import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Message, Order } from "@prisma/client";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { ArrowLeft, ArrowUp, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { messageSchema } from "~/constants/schemas";
import { cn, formatDate, formatTime, isSameDay } from "~/lib/utils";
import {
  createMessage,
  getChatById,
  getChatMessages,
  getOrdersChatByUser,
} from "~/models/chat.server";
import { getUser } from "~/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  invariant(params.id, "Id not found");

  const user = await getUser(request);
  if (!user) {
    return redirect("/login?redirectTo=/inbox");
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");

  const chat = await getChatById(params.id);
  if (!chat || !chat.participants.find((value) => value.id === user.id)) {
    throw new Response("Not Found", { status: 404 });
  }

  const messages = await getChatMessages({ chatId: chat.id, page });
  const ordersChat = await getOrdersChatByUser(user.id);
  return { chat, user, loadedMessages: messages || [], ordersChat };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return redirect("/login?redirectTo=/inbox");
  }
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: messageSchema });
  if (submission.status !== "success") {
    return submission.reply();
  }
  const { content, chatId, senderId } = submission.value;
  await createMessage({ content, senderId, chatId });
  return submission.reply({ resetForm: true });
};

// Helper: Group messages with a date divider
const groupMessagesWithDates = (messages: Message[]) => {
  const grouped: Array<
    { type: "date"; date: Date } | { type: "message"; data: Message }
  > = [];
  let lastDate: Date | null = null;

  messages.forEach((message) => {
    const messageDate = message.createdAt;
    // Insert a divider if the day changes or this is the first message
    if (!lastDate || !isSameDay(messageDate, lastDate)) {
      grouped.push({ type: "date", date: messageDate });
      lastDate = messageDate;
    }
    grouped.push({ type: "message", data: message });
  });
  return grouped;
};

export default function ChatPage() {
  const { chat, user, loadedMessages, ordersChat } =
    useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(messageSchema),
  });

  const participant = chat.participants.find((item) => item.id !== user.id);

  const fetcher = useFetcher<typeof loader>();
  const [shouldFetch, setShouldFetch] = useState(true);
  const [page, setPage] = useState(2);
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState<number | null>(null);
  const [scrollHeight, setScrollHeight] = useState(0);

  const groupedItems = useMemo(() => {
    return groupMessagesWithDates([...olderMessages, ...loadedMessages]);
  }, [olderMessages, loadedMessages]);

  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      // Scroll to bottom on initial load and when new messages are added
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [loadedMessages]);

  useEffect(() => {
    const node = containerRef.current;
    function handleScroll(this: HTMLDivElement) {
      setScrollTop(this.scrollTop);
    }
    if (node) {
      node.addEventListener("scroll", handleScroll);
      // Initial scroll to bottom
      node.scrollTo({ top: node.scrollHeight, behavior: "auto" });
      setScrollHeight(node.scrollHeight);
    }
    return () => {
      if (node) node.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!scrollTop || !shouldFetch || scrollTop > 100) return;
    fetcher.load(`?page=${page}`);
    setShouldFetch(false);
  }, [scrollHeight, scrollTop, shouldFetch, fetcher, page]);

  useEffect(() => {
    if (fetcher.data) {
      const newMessages = fetcher.data.loadedMessages;
      if (newMessages.length !== 0) {
        setOlderMessages((prev) => [...newMessages, ...prev]);
        setPage((prev) => prev + 1);
        setShouldFetch(true);
      } else {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Chat Header */}
      <div className="px-4 py-2.5 border-b flex items-center gap-3 backdrop-blur bg-background/60 absolute top-0 left-0 right-0 z-10">
        <Link
          to="/inbox"
          className="md:hidden p-2 hover:bg-accent rounded-full shrink-0"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm">👥</span>
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
          </div>
          <div>
            <h2 className="font-semibold">{participant?.email}</h2>
            <p className="text-sm text-muted-foreground">Онлайн</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto space-y-4 bg-background py-20 px-4"
      >
        {ordersChat && (
          <div className="space-y-4">
            {ordersChat.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-primary"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Заказ #{item.order?.id}</h3>
                  <Link
                    to={`/track?id=${item.order?.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Перейти в заказ
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Статус:</span>{" "}
                    {item.order?.status}
                  </div>
                  {/* <div>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      ${group.order.totalAmount}
                    </div> */}
                </div>
              </div>
            ))}
          </div>
        )}
        {groupedItems.length > 0 && (
          <div className="space-y-4">
            {groupedItems.map((item, index) => {
              if (item.type === "date") {
                return (
                  <div
                    key={`date-${index}`}
                    data-item={index}
                    className="flex items-center py-1"
                  >
                    <div className="flex-grow border-t" />
                    <span className="px-3 text-xs font-medium text-muted-foreground bg-background">
                      {formatDate(item.date)}
                    </span>
                    <div className="flex-grow border-t" />
                  </div>
                );
              }

              const message = item.data;
              const isCurrentUser = message.senderId === user.id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 group",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col gap-1 max-w-[min(75%,theme(spacing.96))]",
                      isCurrentUser ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl p-3 text-sm transition-colors",
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                        !isCurrentUser && "hover:bg-muted/80"
                      )}
                    >
                      <div className="break-all">{message.content}</div>
                    </div>
                    <time
                      className={cn(
                        "text-xs text-muted-foreground px-2",
                        isCurrentUser ? "text-right" : "text-left"
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Input */}

      <Form
        method="post"
        className="py-2.5 px-4 border-t absolute bottom-0 left-0 right-0 z-10 bg-background"
        id={form.id}
        key={form.key}
      >
        <div className="flex gap-2">
          <Input
            name={fields.content.name}
            placeholder="Напишите сообщение..."
            autoComplete="off"
            className="rounded-full h-11 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full w-11 h-11 shrink-0"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
        <input name={fields.chatId.name} value={chat.id} type="hidden" />
        <input name={fields.senderId.name} value={user.id} type="hidden" />
      </Form>
    </div>
  );
}
