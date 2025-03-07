import { Chat, Message, User } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, formatRelativeTime } from "~/lib/utils";

export function ChatMessages({
  chat,
  user,
  initMessages,
  limit = 10,
}: {
  chat: Chat;
  user: User;
  initMessages: Message[];
  limit?: number;
}) {
  const [messages, setMessages] = useState(initMessages);
  const [cursor, setCursor] = useState<string | null>(
    initMessages.length === limit
      ? initMessages[initMessages.length - 1].id
      : null
  );
  const fetcher = useFetcher<Message[]>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (!cursor || fetcher.state === "loading") return;
    fetcher.load(`/chat?cursor=${cursor}&chatId=${chat.id}`);
  }, [cursor, fetcher, chat]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [fetcher, loadMore]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const newMessages = fetcher.data;

      if (newMessages.length === 0) {
        setCursor(null);
      } else {
        setMessages((prev) => [...newMessages, ...prev]);

        if (newMessages.length < limit) {
          setCursor(null);
        } else {
          setCursor(newMessages[newMessages.length - 1].id);
        }
      }
    }
  }, [fetcher.data, fetcher.state, limit]);

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 bg-background py-20 px-4">
      <div ref={loadMoreRef} className="h-1"></div>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center pt-8">
          <div className="mb-4 text-muted-foreground">
            <MessageCircle strokeWidth={1} className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Здесь Пусто...</h2>
          <p className="text-muted-foreground">
            Отправь сообщение, чтобы начать конверсацию
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const isCurrentUser = message.senderId === user.id;
          return (
            <div
              key={message.id}
              className={cn(
                "flex w-max max-w-[75%] flex-col gap-2 rounded-2xl px-3 py-2 text-sm",
                isCurrentUser
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  isCurrentUser
                    ? "text-primary-foreground/80 ml-auto"
                    : "text-muted-foreground"
                )}
              >
                {formatRelativeTime(message.createdAt)}
              </span>
              <div className="break-all">{message.content}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
