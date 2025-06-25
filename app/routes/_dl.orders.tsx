import { LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { getOrdersByStatus, getOrdersByUser } from "~/models/order.server";
import { getUserId } from "~/session.server";
import { formatCurrency, formatDate } from "~/lib/utils";
import { Order, OrderStatus, PricingTier, Service, User } from "@prisma/client";
import { Button } from "~/components/ui/button";
import {
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileCheck,
  Loader,
  FilePlus,
  FileWarning,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { siteConfig } from "~/config/site";

type OrderWithRelations = Order & {
  pricingTier: (PricingTier & { service: Service }) | null;
  buyer: User;
  seller: User;
};

// Status tab configuration
const STATUS_TABS = [
  { key: "PENDING", label: "Ожидающие" },
  { key: "IN_PROGRESS", label: "В работе" },
  { key: "REVIEW", label: "На проверке" },
  { key: "COMPLETED", label: "Выполненные" },
  { key: "CANCELED", label: "Отмененные" },
] as const;

// Status display configuration with Lucide icons
const STATUS_DETAILS: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
    description: {
      buyer: string;
      seller: string;
      general: string;
    };
  }
> = {
  PENDING: {
    label: "Ожидает принятия",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-5 w-5" />,
    description: {
      buyer: "Ожидает принятия исполнителем",
      seller: "Требуется ваше принятие",
      general: "Ожидает принятия",
    },
  },
  IN_PROGRESS: {
    label: "В работе",
    color: "bg-blue-100 text-blue-800",
    icon: <Loader className="h-5 w-5" />,
    description: {
      buyer: "Работа над заказом",
      seller: "Работа над заказом",
      general: "Работа над заказом",
    },
  },
  REVIEW: {
    label: "На проверке",
    color: "bg-purple-100 text-purple-800",
    icon: <FileCheck className="h-5 w-5" />,
    description: {
      buyer: "Ожидает вашей проверки",
      seller: "Ожидает проверки заказчиком",
      general: "На проверке",
    },
  },
  COMPLETED: {
    label: "Выполнен",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-5 w-5" />,
    description: {
      buyer: "Заказ успешно выполнен",
      seller: "Заказ успешно выполнен",
      general: "Заказ успешно выполнен",
    },
  },
  CANCELED: {
    label: "Отменен",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-5 w-5" />,
    description: {
      buyer: "Заказ был отменен",
      seller: "Заказ был отменен",
      general: "Заказ был отменен",
    },
  },
  DISPUTE: {
    label: "В споре",
    color: "bg-orange-100 text-orange-800",
    icon: <AlertCircle className="h-5 w-5" />,
    description: {
      buyer: "Заказ в стадии разрешения спора",
      seller: "Заказ в стадии разрешения спора",
      general: "В процессе разрешения спора",
    },
  },
};

// Default status display for fallback
const DEFAULT_STATUS = {
  label: "Неизвестно",
  color: "bg-gray-100 text-gray-800",
  icon: <FileWarning className="h-5 w-5" />,
  description: {
    buyer: "Статус не определен",
    seller: "Статус не определен",
    general: "Статус не определен",
  },
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login?redirectTo=/orders");

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") as OrderStatus) || "PENDING";

  const [statusCountsResult, currentOrders] = await Promise.all([
    getOrdersByStatus(userId),
    getOrdersByUser(userId, status),
  ]);

  const statusCounts = statusCountsResult.reduce(
    (acc, item) => ({
      ...acc,
      [item.status]: item._count.status,
    }),
    {} as Record<OrderStatus, number>
  );

  return {
    statusCounts,
    currentOrders,
    userId,
    currentStatus: status,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `Заказы ${data?.currentStatus} - ${siteConfig.name}` }];
};

export default function OrdersPage() {
  const { statusCounts, currentOrders, userId, currentStatus } =
    useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  const handleStatusChange = (status: OrderStatus) => {
    setSearchParams({ status });
  };

  return (
    <div className="mx-auto px-4 py-8 xl:px-0 max-w-screen-xl overflow-scroll">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Мои заказы</h1>
        <p className="text-gray-600 mt-1">
          Управляйте всеми вашими заказами в одном месте
        </p>
      </div>

      {/* Status Navigation Tabs */}
      <div className="border-b">
        <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key as OrderStatus)}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                currentStatus === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              aria-current={currentStatus === tab.key ? "page" : undefined}
              role="tab"
            >
              {tab.label}
              {statusCounts[tab.key as OrderStatus] > 0 && (
                <Badge
                  className="ml-2 rounded-full text-xs py-0.5 px-2"
                  variant={currentStatus === tab.key ? "default" : "outline"}
                >
                  {statusCounts[tab.key as OrderStatus]}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Orders List */}
      <div className="mt-6">
        {currentOrders.length === 0 ? (
          <EmptyOrdersState status={currentStatus} />
        ) : (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <OrderCard key={order.id} order={order} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EmptyOrdersStateProps {
  status: string;
}

function EmptyOrdersState({ status }: EmptyOrdersStateProps) {
  const statusLabel =
    STATUS_TABS.find((tab) => tab.key === status)?.label || status;

  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Нет заказов</h3>
      <p className="mt-1 text-sm text-gray-500">
        У вас пока нет заказов со статусом {statusLabel}
      </p>
    </div>
  );
}

interface OrderCardProps {
  order: OrderWithRelations;
  userId: string;
}

function OrderCard({ order, userId }: OrderCardProps) {
  const isBuyer = userId === order.buyerId;
  const counterparty = isBuyer ? order.seller : order.buyer;

  const statusInfo = STATUS_DETAILS[order.status] || DEFAULT_STATUS;
  const statusDescription = isBuyer
    ? statusInfo.description.buyer
    : statusInfo.description.seller;

  return (
    <div className="bg-card border p-5 rounded-lg shadow hover:shadow-lg overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {order.pricingTier?.service.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isBuyer ? "Исполнитель: " : "Заказчик: "}
            <span className="font-medium text-gray-700">
              {counterparty.email}
            </span>
          </p>
        </div>
        <div className="flex items-center">
          <span
            className={`flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-medium ${statusInfo.color}`}
          >
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.label}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Тариф</p>
          <p className="font-medium text-gray-900">
            {order.pricingTier?.variant}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Стоимость</p>
          <p className="font-medium text-gray-900">
            {formatCurrency(order.pricingTier?.price || 0)} ₽
          </p>
        </div>
        <div>
          <p className="text-gray-500">ID заказа</p>
          <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
        </div>
        <div>
          <p className="text-gray-500">Создан</p>
          <p className="font-medium text-gray-900">
            {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <div className="text-sm text-gray-500">{statusDescription}</div>
        <Button
          className="inline-flex rounded-full items-center text-sm font-medium hover:no-underline gap-1"
          asChild
          variant="outline"
        >
          <Link to={`/track?id=${order.id}`}>
            Подробнее
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
