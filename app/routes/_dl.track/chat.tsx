import { getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useFetcher } from "@remix-run/react";
import {
  ArrowUp,
  AlertCircle,
  File,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  User,
  X,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { MessageSchema } from "~/constants/schemas";
import { formatDate, formatTime } from "~/lib/utils";
import { type action } from "./route";
import { ChangeEvent, useEffect, useRef } from "react";
import { Media, OrderStatus } from "@prisma/client";
import { useFileUpload } from "../upload";
import { useAttachments } from "~/hooks/use-attachments";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { InputConform } from "~/components/conform/input";

interface ChatProps {
  order: {
    chat: {
      id: string;
      messages: MessageProps[];
    } | null;
    status: OrderStatus;
    createdAt: Date;
    sellerId: string;
    buyerId: string;
  };
  user: {
    id: string;
  };
}

const MAX_ATTACHMENTS = 5;

export function Chat({ order, user }: ChatProps) {
  const fetcher = useFetcher<typeof action>();
  const [form, fields] = useForm({
    lastResult: fetcher.state === "idle" ? fetcher.data : null,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: MessageSchema });
    },
    defaultValue: {
      chatId: order.chat?.id,
    },
  });
  const { files, submit } = useFileUpload();
  const { attachments, add, remove, reset } = useAttachments(
    undefined,
    MAX_ATTACHMENTS
  );

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = fetcher.state !== "idle";
  const isClientSeller = order.sellerId === user.id;
  const isClientBuyer = order.buyerId === user.id;

  const actionMap: Record<
    string,
    {
      title: string;
      description: string;
      icon: React.ReactNode;
      buttonText: string;
      variant: "default" | "destructive" | "outline";
    }
  > = {
    IN_PROGRESS: {
      title: "Перевести заказ в работу",
      description:
        "Исполнитель начнет работу над заказом, и вы сможете отслеживать прогресс.",
      icon: <CheckCircle2 size={20} className="text-primary" />,
      buttonText: "Начать работу",
      variant: "default",
    },
    REVIEW: {
      title: "Отправить на проверку",
      description: "Работа готова к проверке заказчиком.",
      icon: <CheckCircle2 size={20} className="text-primary" />,
      buttonText: "Отправить на проверку",
      variant: "default",
    },
    COMPLETED: {
      title: "Подтвердить завершение",
      description:
        "Заказ будет считаться выполненным, оплата будет переведена исполнителю.",
      icon: <CheckCircle2 size={20} className="text-primary" />,
      buttonText: "Подтвердить завершение",
      variant: "default",
    },
    PENDING: {
      title: "Вернуть на доработку",
      description: "Заказ будет возвращен исполнителю для внесения изменений.",
      icon: <AlertCircle size={20} className="text-amber-500" />,
      buttonText: "Вернуть на доработку",
      variant: "outline",
    },
    CANCELED: {
      title: "Отменить заказ",
      description: "Заказ будет отменен без возможности восстановления.",
      icon: <AlertCircle size={20} className="text-destructive" />,
      buttonText: "Отменить заказ",
      variant: "destructive",
    },
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [order.chat?.messages?.length]);

  useEffect(() => {
    if (fetcher.data?.initialValue === null) {
      reset();
    }
  }, [fetcher.data]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight;
    }
  };

  const getActionMessage = (targetStatus: string) => {
    const { title, description, icon, buttonText, variant } =
      actionMap[targetStatus];

    return (
      <div className="bg-white rounded-lg border border-border p-4 mb-4 shadow-sm sticky top-0 z-50">
        <div className="flex items-start gap-3">
          <div className="rounded-full p-2 bg-secondary flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <div className="flex gap-2 mt-1">
              <Button
                onClick={() => handleStatusUpdate(targetStatus)}
                variant={variant}
                className="px-4"
              >
                {buttonText}
              </Button>
              {targetStatus === "COMPLETED" && (
                <Button
                  onClick={() => handleStatusUpdate("IN_PROGRESS")}
                  variant="outline"
                >
                  На доработку
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getActionButtons = () => {
    if (order.status === "COMPLETED" || order.status === "CANCELED") {
      return null;
    }

    if (order.status === "PENDING" && isClientSeller) {
      return getActionMessage("IN_PROGRESS");
    } else if (order.status === "IN_PROGRESS" && isClientSeller) {
      return getActionMessage("REVIEW");
    } else if (order.status === "REVIEW" && isClientBuyer) {
      return getActionMessage("COMPLETED");
    }

    return null;
  };

  const handleStatusUpdate = (newStatus: string) => {
    fetcher.submit(
      { intent: "updateStatus", status: newStatus },
      { method: "post" }
    );
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (!newFiles || newFiles.length === 0) return;

    submit(newFiles);
    e.target.value = "";
  };

  useEffect(() => {
    if (files.length > 0) {
      add(files);
    }
  }, [files]);

  return (
    <div className="bg-background sm:rounded-lg border overflow-hidden h-[650px] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <MessageSquare size={18} className="text-primary" />
          </div>
          <h2 className="font-medium text-foreground">Чат заказа</h2>
        </div>
      </div>

      {/* Message area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        ref={chatContainerRef}
      >
        {/* Системные сообщения */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full border border-border">
            <Calendar size={12} />
            Заказ создан {formatDate(order.createdAt)}
          </div>
        </div>

        {/* Возможные действия в чате */}
        {getActionButtons()}

        {/* Сообщения */}
        {order.chat?.messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            currentUserId={user.id}
            showAvatar={
              index === 0 ||
              order.chat?.messages[index - 1].sender.id !== message.sender.id
            }
          />
        ))}
      </div>

      {/* Просмотр вложений */}
      {attachments.length > 0 && (
        <div className="flex h-32 overflow-x-auto border-t gap-2 p-3 bg-secondary">
          {attachments.map((attachment, idx) => (
            <div
              key={idx}
              className="relative group h-full aspect-square bg-background rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary border border-border"
            >
              {attachment.type === "IMAGE" ? (
                <img
                  src={attachment.url}
                  className="w-full h-full object-cover"
                  alt={attachment.name || "Изображение"}
                />
              ) : attachment.type === "MOVIE" ? (
                <video
                  controls
                  className="w-full h-full object-cover"
                  src={attachment.url}
                  muted
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <File
                    className="size-8 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </div>
              )}
              <div
                title={attachment.name}
                className="absolute bottom-1 left-1 right-1 text-xs text-foreground truncate bg-background/90 px-1 rounded"
              >
                {attachment.name}
              </div>
              <button
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-foreground/70 text-background rounded-full flex items-center justify-center hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label={`Удалить ${attachment.name || "файл"}`}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Поле ввода */}
      <fetcher.Form id={form.id} method="post" className="p-3 border-t">
        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
            <InputConform
              meta={fields.content}
              //ref={inputRef}
              placeholder="Введите сообщение..."
              className="pr-10 rounded-full border-input focus:border-primary h-11 focus:ring-1 focus:ring-primary/20"
              autoComplete="off"
              disabled={isSubmitting}
              type="text"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className={cn(
                      "text-muted-foreground rounded-full hover:bg-secondary transition-colors",
                      attachments.length >= MAX_ATTACHMENTS &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    variant="ghost"
                    size="icon"
                    disabled={attachments.length >= MAX_ATTACHMENTS}
                  >
                    <Paperclip size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {attachments.length >= MAX_ATTACHMENTS
                    ? `Достигнут лимит (${MAX_ATTACHMENTS})`
                    : "Приложить файл"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            tabIndex={-1}
            onChange={handleFileChange}
            aria-hidden
          />
          <input
            name={fields.attachments.name}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            value={JSON.stringify(attachments)}
            readOnly
          />
          <input
            className="sr-only"
            {...getInputProps(fields.chatId, { type: "text" })}
            key={fields.chatId.key}
          />

          <Button
            type="submit"
            size="icon"
            className={cn(
              "rounded-full w-11 h-11 flex items-center justify-center transition-colors",
              isSubmitting && "opacity-70"
            )}
            aria-label="Отправить сообщение"
            disabled={isSubmitting}
            name="intent"
            value="sendMessage"
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}

interface MessageProps {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: {
      url: string;
    } | null;
  };
  attachments: Media[];
  isSystemMessage: boolean;
  createdAt: Date;
  content: string;
}

const ChatMessage = ({
  message,
  currentUserId,
  showAvatar = true,
}: {
  message: MessageProps;
  currentUserId: string;
  showAvatar?: boolean;
}) => {
  const isCurrentUser = message.sender?.id === currentUserId;
  const isSystem = message.isSystemMessage;

  if (isSystem) {
    return (
      <div className="text-center">
        <div className="inline-block bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full border border-border">
          {message.content}
        </div>
      </div>
    );
  }

  const messageTime = new Date(message.createdAt);

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] flex gap-2 ${
          isCurrentUser ? "flex-row-reverse" : ""
        }`}
      >
        {showAvatar ? (
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center self-start",
              isCurrentUser
                ? "bg-primary/10 border-primary/20"
                : "bg-secondary border-border",
              "border overflow-hidden flex-shrink-0"
            )}
          >
            {message.sender?.avatar ? (
              <img
                src={message.sender.avatar.url}
                alt={message.sender.name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User
                size={14}
                className={
                  isCurrentUser ? "text-primary" : "text-muted-foreground"
                }
              />
            )}
          </div>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}

        <div>
          {showAvatar && (
            <div
              className={`text-xs font-medium mb-1 ${
                isCurrentUser ? "text-right text-primary" : "text-foreground"
              }`}
            >
              {message.sender.name || "Пользователь"}
            </div>
          )}

          <div
            className={cn(
              "px-3 py-2 rounded-2xl break-words",
              isCurrentUser
                ? "bg-primary text-primary-foreground rounded-br-none"
                : "bg-secondary text-secondary-foreground rounded-bl-none"
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>

          {message.attachments.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto justify-end">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative overflow-hidden rounded-lg border border-border bg-background h-24 w-24 group"
                >
                  {attachment.type === "IMAGE" ? (
                    <a
                      href={attachment.url}
                      download={attachment.name || "image"}
                      className="block h-full w-full"
                    >
                      <img
                        src={attachment.url}
                        className="w-full h-full object-cover"
                        alt={attachment.name || "Изображение"}
                      />
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Download size={18} className="text-background" />
                      </div>
                    </a>
                  ) : attachment.type === "MOVIE" ? (
                    <div className="relative h-full w-full">
                      <video
                        className="w-full h-full object-cover"
                        src={attachment.url}
                        muted
                      />
                      <a
                        href={attachment.url}
                        download={attachment.name || "video"}
                        className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Download size={18} className="text-background" />
                      </a>
                    </div>
                  ) : (
                    <a
                      href={attachment.url}
                      download={attachment.name || "file"}
                      className="flex h-full w-full items-center justify-center bg-secondary/50 relative"
                    >
                      <File
                        className="size-8 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                      <div className="absolute bottom-0 left-0 right-0 text-xs text-center truncate bg-background/80 py-1 px-2">
                        {attachment.name || "Файл"}
                      </div>
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Download size={18} className="text-background" />
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex text-xs mt-1 text-muted-foreground ${
              isCurrentUser ? "justify-end" : "justify-start"
            }`}
          >
            <time dateTime={message.createdAt.toString()}>
              {formatTime(messageTime)}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
};
