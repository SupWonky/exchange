import { parseWithZod } from "@conform-to/zod";
import { Media, OrderStatus, User } from "@prisma/client";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  Package,
  RotateCcw,
  UserIcon,
  XCircle,
} from "lucide-react";
import { TrackAction } from "~/constants/schemas";
import { formatDate } from "~/lib/utils";
import { createMessage } from "~/models/chat.server";
import { getOrder, updateOrderStatus } from "~/models/order.server";
import { getUser, requireUserId } from "~/session.server";
import { Chat } from "./chat";

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
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: TrackAction });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");

  if (!orderId) {
    return submission.reply({ formErrors: ["Заказ не указан"] });
  }

  const value = submission.value;

  switch (value.intent) {
    case "sendMessage":
      await createMessage({
        content: value.content,
        senderId: userId,
        chatId: value.chatId,
        attachments: value.attachments,
      });
      break;

    case "updateStatus":
      await updateOrderStatus({
        orderId,
        newStatus: value.status as OrderStatus,
      });
      break;
  }

  return submission.reply({ resetForm: true });
};

export default function OrderTrackingPage() {
  const { order, user } = useLoaderData<typeof loader>();

  const getStatusInfo = (status: OrderStatus) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: "amber",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        label: "Ожидает",
      },
      IN_PROGRESS: {
        icon: RotateCcw,
        color: "blue",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        label: "В работе",
      },
      REVIEW: {
        icon: AlertCircle,
        color: "purple",
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
        label: "На проверке",
      },
      COMPLETED: {
        icon: CheckCircle,
        color: "emerald",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        label: "Завершен",
      },
      CANCELED: {
        icon: XCircle,
        color: "red",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        label: "Отменен",
      },
    };

    const config = statusConfig[status] || {
      icon: Clock,
      color: "gray",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
      label: status.replace("_", " "),
    };
    const StatusIcon = config.icon;

    return {
      icon: <StatusIcon className={`text-${config.color}-500`} size={18} />,
      text: config.label,
      className: `${config.bgColor} ${config.textColor} ${config.borderColor}`,
    };
  };

  const statusInfo = getStatusInfo(order.status);

  // Status steps configuration
  const statusSteps = [
    { status: "PENDING", label: "Ожидает", icon: Clock },
    { status: "IN_PROGRESS", label: "В работе", icon: RotateCcw },
    { status: "REVIEW", label: "На проверке", icon: AlertCircle },
    { status: "COMPLETED", label: "Завершен", icon: CheckCircle },
  ];

  // Helper to find current step index
  const getCurrentStepIndex = () => {
    if (order.status === "CANCELED") return -1;
    return statusSteps.findIndex((step) => step.status === order.status);
  };

  return (
    <div className="container mx-auto max-w-6xl !px-0 sm:px-4 py-6 space-y-6">
      {/* Навигация */}
      <nav className="flex items-center text-sm text-gray-500 mb-4">
        <a
          href="/orders"
          className="hover:text-indigo-500 flex items-center gap-1.5 transition-colors group"
        >
          <span className="rounded-full transition-colors">
            <ChevronLeft size={16} />
          </span>
          <span>Назад к заказам</span>
        </a>
      </nav>

      {/* Шапка */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Package className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Заказ #{order.id.slice(0, 8)}
            </h1>
            <p className="text-gray-500 flex items-center gap-1.5 text-sm">
              <Calendar size={14} />
              Создан {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`px-4 py-2 rounded-full ${statusInfo.className} flex items-center gap-2 border`}
          >
            {statusInfo.icon}
            <span className="font-medium">{statusInfo.text}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка */}
        <div className="space-y-6">
          {/* Этапы заказа и прогресс */}
          <div className="bg-white border sm:rounded-lg overflow-hidden">
            <h2 className="font-medium text-gray-900 p-4 border-b">
              Этапы заказа
            </h2>
            <div className="p-6">
              <div className="relative">
                {/* Вертикальная линия */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Статусы */}
                {statusSteps.map((step, index) => {
                  const currentStep = getCurrentStepIndex();
                  let state = "pending";

                  if (index < currentStep) {
                    state = "completed";
                  } else if (index === currentStep) {
                    state = "current";
                  } else if (order.status === "CANCELED") {
                    state = "canceled";
                  }

                  return (
                    <div
                      key={step.status}
                      className="flex items-start mb-6 relative"
                    >
                      <div
                        className={`
                        z-10 rounded-full w-8 h-8 flex items-center justify-center border-2
                        ${
                          state === "completed"
                            ? "bg-primary border-primary"
                            : state === "current"
                            ? "bg-white border-primary"
                            : state === "canceled"
                            ? "bg-gray-100 border-gray-300"
                            : "bg-white border-gray-300"
                        }
                      `}
                      >
                        {state === "completed" ? (
                          <Check size={16} className="text-white" />
                        ) : state === "current" ? (
                          <step.icon size={16} className="text-primary" />
                        ) : (
                          <step.icon size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4 text-gray-800">
                        <h3>{step.label}</h3>

                        {state === "completed" && (
                          <p className="text-xs mt-1">
                            {formatDate(order.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Особый статус для отмены */}
                {order.status === "CANCELED" && (
                  <div className="flex items-start relative">
                    <div className="z-10 rounded-full w-8 h-8 flex items-center justify-center border-2 bg-destructive border-destructive">
                      <XCircle size={16} className="text-white" />
                    </div>
                    <div className="ml-4 text-gray-800">
                      <h3>Отменен</h3>
                      <p className="text-xs mt-1">
                        Заказ отменен {formatDate(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Информация о заказе */}
          <div className="bg-white sm:rounded-lg overflow-hidden border">
            <h2 className="font-medium text-gray-900 p-4 border-b">
              Детали заказа
            </h2>
            <div className="p-6">
              {order.pricingTier && (
                <div className="space-y-4 mb-6">
                  <InfoItem
                    label="Услуга"
                    value={
                      order.pricingTier.service?.title || "Название услуги"
                    }
                  />
                  <InfoItem
                    label="Пакет"
                    value={order.pricingTier.variant}
                    badge={true}
                    badgeColor={
                      order.pricingTier.variant === "BASIC"
                        ? "bg-gray-50 text-gray-700 border-gray-200"
                        : order.pricingTier.variant === "STANDARD"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }
                  />
                  <InfoItem
                    label="Стоимость"
                    value={`${order.pricingTier.price} ₽`}
                    valueClassName="text-lg font-semibold text-primary"
                  />
                  <InfoItem
                    label="Срок выполнения"
                    value={`${order.pricingTier.duration / 60 / 24} дней`}
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Участники
                </h3>
                <div className="space-y-4">
                  <ParticipantAvatar user={order.buyer} role="заказчик" />
                  <div className="border-t border-gray-100 pt-4"></div>
                  <ParticipantAvatar user={order.seller} role="исполнитель" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="lg:col-span-2">
          {/* Чат */}
          <Chat order={order} user={user} />
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
  <div className="flex justify-between items-center gap-2">
    <span className="text-gray-500">{label}</span>
    {badge ? (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor} border truncate`}
      >
        {value}
      </span>
    ) : (
      <span className={valueClassName || "font-medium text-gray-900 truncate"}>
        {value}
      </span>
    )}
  </div>
);

const ParticipantAvatar = ({
  user,
  role,
}: {
  user: User & { avatar: Media | null };
  role: string;
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center 
      ${role === "исполнитель" ? "bg-green-50" : "bg-blue-50"} border ${
        role === "исполнитель" ? "border-green-100" : "border-blue-100"
      }`}
    >
      {user?.avatar ? (
        <img
          src={user.avatar.url}
          alt={user.name || role}
          className="size-10 rounded-full object-cover"
        />
      ) : (
        <UserIcon
          size={16}
          className={`${
            role === "исполнитель" ? "text-green-500" : "text-blue-500"
          }`}
        />
      )}
    </div>
    <div>
      <p className="font-medium text-gray-900">
        {user?.name || `${role} Name`}
      </p>
      <p className="text-xs text-gray-500 capitalize">{role}</p>
    </div>
  </div>
);
