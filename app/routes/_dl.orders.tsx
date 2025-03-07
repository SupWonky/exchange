import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { getOrdersByStatus, getOrdersByUser } from "~/models/order.server";
import { getUserId } from "~/session.server";
import { formatCurrency, formatDate } from "~/lib/utils";
import { Order, OrderStatus, PricingTier, Service, User } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Badge } from "~/components/ui/badge";

type OrderWithRelations = Order & {
  pricingTier: PricingTier & { service: Service };
  buyer: User;
  seller: User;
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

export default function OrdersPage() {
  const { statusCounts, currentOrders, userId, currentStatus } =
    useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  const handleStatusChange = (status: OrderStatus) => {
    setSearchParams({ status });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Мои заказы</h1>
        <p className="text-gray-600 mt-1">
          Управляйте всеми вашими заказами в одном месте
        </p>
      </div>

      {/* Status Navigation Tabs */}
      <div className="border-b">
        <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
          {[
            { key: "PENDING", label: "Ожидающие" },
            { key: "IN_PROGRESS", label: "В работе" },
            { key: "REVIEW", label: "На проверке" },
            { key: "COMPLETED", label: "Выполненные" },
            { key: "CANCELED", label: "Отмененные" },
          ].map((tab) => (
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
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Нет заказов
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              У вас пока нет заказов со статусом{" "}
              {
                {
                  PENDING: "Ожидающие",
                  IN_PROGRESS: "В работе",
                  REVIEW: "На проверке",
                  COMPLETED: "Выполненные",
                  CANCELED: "Отмененные",
                }[currentStatus]
              }
            </p>
          </div>
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

interface OrderCardProps {
  order: OrderWithRelations;
  userId: string;
}

function OrderCard({ order, userId }: OrderCardProps) {
  const isBuyer = userId === order.buyerId;
  const counterparty = isBuyer ? order.seller : order.buyer;

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Ожидает принятия",
          color: "bg-yellow-100 text-yellow-800",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "IN_PROGRESS":
        return {
          label: "В работе",
          color: "bg-blue-100 text-blue-800",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 10.414l2.293 2.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 12.414V15a1 1 0 102 0v-2.586z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "REVIEW":
        return {
          label: "На проверке",
          color: "bg-purple-100 text-purple-800",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "COMPLETED":
        return {
          label: "Выполнен",
          color: "bg-green-100 text-green-800",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "CANCELLED":
        return {
          label: "Отменен",
          color: "bg-red-100 text-red-800",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "DISPUTE":
        return {
          label: "В споре",
          color: "bg-orange-100 text-orange-800",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-800",
          icon: null,
        };
    }
  };

  const statusInfo = getStatusDetails(order.status);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {order.pricingTier.service.title}
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
              <span>{statusInfo.label}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Тариф</p>
            <p className="font-medium text-gray-900">
              {order.pricingTier.variant}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Стоимость</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(order.pricingTier.price)} ₽
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
          <div className="text-sm text-gray-500">
            {order.status === "PENDING" &&
              isBuyer &&
              "Ожидает принятия исполнителем"}
            {order.status === "PENDING" &&
              !isBuyer &&
              "Требуется ваше принятие"}
            {order.status === "IN_PROGRESS" && "Работа над заказом"}
            {order.status === "REVIEW" && isBuyer && "Ожидает вашей проверки"}
            {order.status === "REVIEW" &&
              !isBuyer &&
              "Ожидает проверки заказчиком"}
            {order.status === "COMPLETED" && "Заказ успешно выполнен"}
            {order.status === "CANCELED" && "Заказ был отменен"}
          </div>
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
    </div>
  );
}
