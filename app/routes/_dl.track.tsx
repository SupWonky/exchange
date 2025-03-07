import { OrderStatus } from "@prisma/client";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  CircleSlash,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Package,
  RotateCcw,
  Send,
  Upload,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "~/lib/utils";
import { getOrder, updateOrderStatus } from "~/models/order.server";
import { getUser } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  if (!user) {
    return redirect("/login");
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");

  if (!orderId) return redirect("/orders");

  const order = await getOrder(orderId);

  if (!order) return redirect("/orders");

  return { order, user };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");

  if (!orderId) return { error: "Неверный ID заказа", status: 400 };

  const formData = await request.formData();
  const intent = formData.get("intent");
  const message = formData.get("message");

  try {
    switch (intent) {
      case "sendMessage":
        if (!message || typeof message !== "string" || !message.trim())
          return { error: "Сообщение не может быть пустым", status: 400 };
        await addOrderMessage(orderId, message.toString());
        return { success: true };

      case "updateStatus":
        const newStatus = formData.get("status");
        if (!newStatus) return { error: "Отсутствует статус", status: 400 };
        await updateOrderStatus({
          orderId,
          newStatus: newStatus.toString() as OrderStatus,
        });
        return { success: true };

      default:
        return { error: "Неверное действие", status: 400 };
    }
  } catch (error) {
    return { error: "Ошибка обработки запроса", status: 500 };
  }
};

export default function OrderTackingPage() {
  const { order, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const messageFormRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [isMessageSending, setIsMessageSending] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && isMessageSending) {
      setMessage("");
      setIsMessageSending(false);
      messageFormRef.current?.reset();
    }
  }, [fetcher.state, isMessageSending]);

  const getStatusInfo = (status: OrderStatus) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: "amber",
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
      },
      IN_PROGRESS: {
        icon: RotateCcw,
        color: "blue",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      },
      REVIEW: {
        icon: AlertCircle,
        color: "purple",
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
      },
      COMPLETED: {
        icon: CheckCircle,
        color: "emerald",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
      },
      CANCELED: {
        icon: XCircle,
        color: "red",
        bgColor: "bg-red-100",
        textColor: "text-red-700",
      },
    };

    const config = statusConfig[status] || {
      icon: Clock,
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
    };
    const StatusIcon = config.icon;

    return {
      icon: <StatusIcon className={`text-${config.color}-500`} size={18} />,
      text: status.replace("_", " "),
      className: `${config.bgColor} ${config.textColor}`,
    };
  };

  const handleStatusUpdate = (newStatus: string) => {
    fetcher.submit(
      { intent: "updateStatus", status: newStatus },
      { method: "post" }
    );
  };

  const handleSendMessage = (e: Event) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsMessageSending(true);
    fetcher.submit({ intent: "sendMessage", message }, { method: "post" });
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Навигация */}
      <nav className="flex items-center text-sm text-gray-500 mb-4">
        <a
          href="/orders"
          className="hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft size={16} />
          Назад к заказам
        </a>
      </nav>

      {/* Шапка */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Package className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Заказ #{order.id.slice(0, 8)}
            </h1>
            <p className="text-gray-500">
              Создан {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`px-4 py-2 rounded-full ${statusInfo.className} flex items-center gap-2`}
          >
            {statusInfo.icon}
            <span className="font-medium">{statusInfo.text}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка */}
        <div className="space-y-6">
          {/* Информация о заказе */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-500" />
              Информация о заказе
            </h2>

            {order.pricingTier && (
              <div className="space-y-4 mb-6">
                <InfoItem
                  label="Услуга"
                  value={order.pricingTier.service?.title || "Название услуги"}
                />
                <InfoItem
                  label="Пакет"
                  value={order.pricingTier.variant}
                  badge={true}
                  badgeColor={
                    order.pricingTier.variant === "BASIC"
                      ? "bg-gray-100 text-gray-700"
                      : order.pricingTier.variant === "STANDARD"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }
                />
                <InfoItem
                  label="Стоимость"
                  value={`${order.pricingTier.price} ₽`}
                  valueClassName="text-lg font-semibold text-green-600"
                />
                <InfoItem
                  label="Срок выполнения"
                  value={`${order.pricingTier.duration / 60 / 24} дней`}
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                История изменений
              </h3>
              <div className="space-y-4">
                <TimelineItem
                  icon={<Calendar size={16} className="text-blue-500" />}
                  date={order.createdAt}
                  title="Заказ создан"
                  description="Заказ был оформлен"
                />
                <TimelineItem
                  icon={<ArrowUpDown size={16} className="text-amber-500" />}
                  date={order.updatedAt}
                  title="Последнее обновление"
                  description={`Статус изменен на ${order.status.replace(
                    "_",
                    " "
                  )}`}
                />
                {order.status === "COMPLETED" && (
                  <TimelineItem
                    icon={
                      <CheckCircle size={16} className="text-emerald-500" />
                    }
                    date={order.updatedAt}
                    title="Завершен"
                    description="Заказ успешно выполнен"
                  />
                )}
                {order.status === "CANCELED" && (
                  <TimelineItem
                    icon={<XCircle size={16} className="text-red-500" />}
                    date={order.updatedAt}
                    title="Отменен"
                    description="Заказ был отменен"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Участники */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserCheck size={20} className="text-gray-500" />
              Участники
            </h2>
            <div className="space-y-5">
              <ParticipantAvatar user={order.buyer} role="заказчик" />
              <div className="border-t border-gray-100 pt-4"></div>
              <ParticipantAvatar user={order.seller} role="исполнитель" />
            </div>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="lg:col-span-2 space-y-6">
          {/* Чат */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare size={20} className="text-gray-500" />
                Коммуникация по заказу
              </h2>
              <div className="flex gap-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  title="Скачать историю"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Системные сообщения */}
              <div className="text-center">
                <div className="inline-block bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
                  Заказ создан {formatDate(order.createdAt)}
                </div>
              </div>

              {/* Сообщения */}
              {order.chat?.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  currentUserId={order.buyerId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Поле ввода */}
            <fetcher.Form
              ref={messageFormRef}
              method="post"
              className="p-4 border-t"
              onSubmit={handleSendMessage}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={fetcher.state !== "idle"}
                />
                <input type="hidden" name="intent" value="sendMessage" />
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                  disabled={!message.trim() || fetcher.state !== "idle"}
                >
                  <Send size={20} />
                </button>
              </div>
            </fetcher.Form>
          </div>

          {/* Действия */}
          {order.status !== "COMPLETED" && order.status !== "CANCELED" && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" />
                Действия с заказом
              </h2>
              <div className="flex flex-wrap gap-3">
                {order.status === "PENDING" && (
                  <>
                    {/* Покупатель может отменить заказ */}
                    {order.sellerId === user.id && (
                      <ActionButton
                        label="Отменить заказ"
                        icon={<CircleSlash size={16} />}
                        onClick={() => handleStatusUpdate("CANCELED")}
                        variant="danger"
                      />
                    )}

                    {/* Исполнитель может начать работу */}
                    {order.sellerId === user.id && (
                      <ActionButton
                        label="Начать работу"
                        icon={<Check size={16} />}
                        onClick={() => handleStatusUpdate("IN_PROGRESS")}
                        variant="primary"
                      />
                    )}
                  </>
                )}

                {order.status === "IN_PROGRESS" && (
                  <>
                    {/* Покупатель может запросить правки */}
                    {order.buyerId === user.id && (
                      <ActionButton
                        label="Запросить правки"
                        icon={<RotateCcw size={16} />}
                        onClick={() => handleStatusUpdate("PENDING")}
                      />
                    )}

                    {/* Исполнитель может отправить на проверку */}
                    {order.sellerId === user.id && (
                      <ActionButton
                        label="Отправить на проверку"
                        icon={<Upload size={16} />}
                        onClick={() => handleStatusUpdate("REVIEW")}
                        variant="primary"
                      />
                    )}
                  </>
                )}

                {order.status === "REVIEW" && (
                  <>
                    {/* Исполнитель может вернуть на доработку */}
                    {order.sellerId === user.id && (
                      <ActionButton
                        label="Вернуть на доработку"
                        icon={<AlertCircle size={16} />}
                        onClick={() => handleStatusUpdate("IN_PROGRESS")}
                      />
                    )}

                    {/* Покупатель может подтвердить завершение */}
                    {order.buyerId === user.id && (
                      <ActionButton
                        label="Подтвердить завершение"
                        icon={<CheckCircle size={16} />}
                        onClick={() => handleStatusUpdate("COMPLETED")}
                        variant="success"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({
  label,
  value,
  badge = false,
  badgeColor = "",
  valueClassName = "",
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeColor?: string;
  valueClassName?: string;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-500">{label}</span>
    {badge ? (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}
      >
        {value}
      </span>
    ) : (
      <span className={valueClassName || "font-medium"}>{value}</span>
    )}
  </div>
);

const TimelineItem = ({
  icon,
  date,
  title,
  description,
}: {
  icon: React.ReactNode;
  date: Date;
  title: string;
  description?: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 p-1 bg-gray-50 rounded-full">{icon}</div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-500">{formatDate(date)}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
  </div>
);

const ParticipantAvatar = ({ user, role }: { user: any; role: string }) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center 
      ${role === "seller" ? "bg-green-100" : "bg-blue-100"}`}
    >
      {user?.avatar ? (
        <img
          src={user.avatar.url}
          alt={user.name || role}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span
          className={`${
            role === "seller" ? "text-green-500" : "text-blue-500"
          } text-lg font-medium`}
        >
          {user?.name?.[0] || <User size={16} />}
        </span>
      )}
    </div>
    <div>
      <p className="font-medium">{user?.name || `${role} Name`}</p>
      <p className="text-sm text-gray-500 capitalize">{role}</p>
      {user?.email && <p className="text-xs text-gray-400">{user.email}</p>}
    </div>
  </div>
);

const ChatMessage = ({
  message,
  currentUserId,
}: {
  message: any;
  currentUserId: string;
}) => {
  const isCurrentUser = message.sender?.id === currentUserId;
  const isSystem = message.isSystemMessage;

  if (isSystem) {
    return (
      <div className="text-center">
        <div className="inline-block bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] flex gap-2 ${
          isCurrentUser ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center self-end mb-1
          ${isCurrentUser ? "bg-blue-100" : "bg-green-100"}`}
        >
          {message.sender?.avatar ? (
            <img
              src={message.sender.avatar.url}
              alt={message.sender.name || "User"}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span
              className={isCurrentUser ? "text-blue-500" : "text-green-500"}
            >
              {message.sender?.name?.[0] || "U"}
            </span>
          )}
        </div>
        <div>
          <div
            className={`p-3 rounded-xl ${
              isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            <p>{message.content}</p>
          </div>
          <p
            className={`text-xs mt-1 ${
              isCurrentUser ? "text-right text-gray-500" : "text-gray-500"
            }`}
          >
            {formatDate(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({
  label,
  icon,
  onClick,
  variant = "default",
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "success" | "danger";
}) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${variantClasses[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
};
