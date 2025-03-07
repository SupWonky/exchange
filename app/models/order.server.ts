import { Order, OrderStatus, PricingTier, Service, User } from "@prisma/client";
import { prisma } from "~/db.server";
import { secondsToDays } from "~/lib/utils";
import { refundEscrow, releaseEscrow } from "./escrow.server";

export function placeOrder({
  buyer,
  pricingTier,
  service,
}: {
  buyer: User;
  pricingTier: PricingTier;
  service: Service;
}) {
  return prisma.$transaction(async (tx) => {
    if (buyer.balance < pricingTier.price) {
      throw new Error("Пополните баланс");
    }

    {
      let chat = await tx.chat.findFirst({
        where: {
          AND: [
            { participants: { some: { id: buyer.id } } },
            { participants: { some: { id: service.userId } } },
            { order: null },
          ],
        },
      });

      if (!chat) {
        chat = await tx.chat.create({
          data: {
            participants: {
              connect: [{ id: buyer.id }, { id: service.userId }],
            },
          },
        });
      }
    }

    const chat = await tx.chat.create({
      data: {
        participants: {
          connect: [{ id: buyer.id }, { id: service.userId }],
        },
      },
    });

    const order = await tx.order.create({
      data: {
        status: "PENDING",
        buyerId: buyer.id,
        sellerId: service.userId,
        pricingTierId: pricingTier.id,
        chatId: chat.id,
      },
    });

    const releaseDueDate = new Date();
    releaseDueDate.setDate(
      releaseDueDate.getDate() + secondsToDays(pricingTier.duration)
    );

    const disputeDeadline = new Date(releaseDueDate);
    disputeDeadline.setDate(disputeDeadline.getDate() + 7);

    const escrowAccount = await tx.escrowAccount.create({
      data: {
        orderId: order.id,
        userId: buyer.id,
        status: "HELD",
        releaseDueDate,
        disputeDeadline,
      },
    });

    await tx.transaction.create({
      data: {
        amount: pricingTier.price,
        type: "ESCROW_HOLD",
        status: "COMPLETED",
        userId: buyer.id,
        orderId: order.id,
        escrowAccountId: escrowAccount.id,
        releaseDueDate,
      },
    });

    await tx.user.update({
      data: {
        balance: {
          decrement: pricingTier.price,
        },
      },
      where: {
        id: buyer.id,
      },
    });

    await tx.escrowAccount.update({
      data: {
        balance: {
          increment: pricingTier.price,
        },
      },
      where: {
        id: escrowAccount.id,
      },
    });

    return order;
  });
}

export async function updateOrderStatus({
  orderId,
  newStatus,
}: {
  orderId: string;
  newStatus: OrderStatus;
}) {
  return prisma.$transaction(async (tx) => {
    // Fetch order with related chat
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        chat: true,
        buyer: true,
        pricingTier: {
          include: { service: true },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Get previous status for tracking
    //const previousStatus = order.status;

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Create a system message in the chat about status change
    // const statusMessage = createOrderStatusMessage({
    //   order,
    //   previousStatus,
    //   newStatus,
    //   updatedById,
    //   comment,
    // });

    // Add the status update as a system message to the chat
    // await tx.message.create({
    //   data: {
    //     content: statusMessage,
    //     isSystemMessage: true,
    //     chatId: order.chatId,
    //     metadata: {
    //       orderUpdate: {
    //         orderId: order.id,
    //         previousStatus,
    //         newStatus,
    //         updatedBy: updatedById,
    //       },
    //     },
    //     senderId: order.buyerId,
    //   },
    // });

    // Handle specific status changes
    if (newStatus === "COMPLETED") {
      // Release funds from escrow when order is completed
      await releaseEscrow(tx, updatedOrder);
    } else if (newStatus === "CANCELED") {
      // Return funds to buyer when order is cancelled
      await refundEscrow(tx, updatedOrder);
    }

    return updatedOrder;
  });
}

// Helper function to create readable order status messages
// export function createOrderStatusMessage({
//   order,
//   previousStatus,
//   newStatus,
//   updatedById,
//   comment,
// }: {
//   order: Order;
//   previousStatus: OrderStatus;
//   newStatus: OrderStatus;
//   updatedById: string;
//   comment: string;
// }) {
//   const isUpdatedByBuyer = updatedById === order.buyerId;
//   const actor = isUpdatedByBuyer ? "Покупатель" : "Продавец";

//   let message = `📋 **Обновление заказа #${order.id}**\n${actor} изменил статус заказа с "${previousStatus}" на "${newStatus}"\n`;

//   if (comment) {
//     message += `💬 Комментарий: ${comment}\n`;
//   }

//   // Add specific messages based on status
//   switch (newStatus) {
//     case "PENDING":
//       message += "Заказ ожидает подтверждения продавца";
//       break;
//     case "IN_PROGRESS":
//       message += "⏳ Работа над заказом началась.";
//       break;
//     case "REVIEW":
//       message += "👀 Заказ готов и ожидает проверки покупателем.";
//       break;
//     case "COMPLETED":
//       message +=
//         "✅ Заказ выполнен успешно. Средства будут переведены продавцу.";
//       break;
//     case "CANCELED":
//       message += "❌ Заказ отменен. Средства будут возвращены покупателю.";
//       break;
//   }

//   return message;
// }

// Get order timeline with all status changes
// export async function getOrderTimeline(orderId: string) {
//   const messages = await prisma.message.findMany({
//     where: {
//       isSystemMessage: true,
//       metadata: {
//         path: ["orderUpdate", "orderId"],
//         equals: orderId,
//       },
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   return messages;
// }

// Display current order status in chat
export async function getOrderStatusComponent(chatId: string) {
  return prisma.order.findFirst({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    include: {
      pricingTier: {
        include: { service: true },
      },
      buyer: true,
      escrowAccount: true,
    },
  });
}

export async function getOrdersByUser(
  userId: User["id"],
  status?: OrderStatus
) {
  return prisma.order.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      ...(status ? { status } : {}),
    },
    include: {
      pricingTier: {
        include: {
          service: true,
        },
      },
      buyer: true,
      seller: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOrdersByStatus(userId: User["id"]) {
  return prisma.order.groupBy({
    by: ["status"],
    _count: {
      status: true,
    },
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
  });
}

export async function getOrder(id: Order["id"]) {
  return prisma.order.findFirst({
    where: {
      id,
    },
    include: {
      pricingTier: {
        include: {
          service: true,
        },
      },
      buyer: true,
      seller: true,
      chat: {
        include: {
          messages: true,
        },
      },
    },
  });
}
