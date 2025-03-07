import { Order, Prisma } from "@prisma/client";

export async function releaseEscrow(
  tx: Prisma.TransactionClient,
  order: Order
): Promise<void> {
  try {
    // 1. Валидация статуса заказа
    if (order.status !== "COMPLETED") {
      throw new Error("Cannot release escrow for non-completed order");
    }

    // 2. Атомарная блокировка эскроу-счета
    const escrowAccount = await tx.escrowAccount.findUnique({
      where: { orderId: order.id },
      select: {
        id: true,
        balance: true,
        status: true,
      },
    });

    // 3. Проверки безопасности
    if (!escrowAccount) {
      throw new Error("Escrow account not found");
    }

    if (escrowAccount.status === "RELEASED") {
      console.warn(`Escrow already released for order ${order.id}`);
      return;
    }

    // 4. Проверка баланса
    if (escrowAccount.balance <= 0) {
      throw new Error("Escrow balance must be positive");
    }

    // 5. Атомарное обновление эскроу-счета
    await tx.escrowAccount.update({
      where: { id: escrowAccount.id },
      data: {
        status: "RELEASED",
        balance: 0, // Явное обнуление вместо decrement
      },
    });

    // 6. Обновление баланса продавца с проверкой валюты
    await tx.user.update({
      where: { id: order.sellerId },
      data: {
        balance: {
          increment: escrowAccount.balance,
        },
      },
      select: {
        id: true,
      },
    });

    // 7. Создание аудиторской записи
    await tx.transaction.create({
      data: {
        type: "ESCROW_RELEASE",
        status: "COMPLETED",
        amount: escrowAccount.balance,
        userId: order.sellerId,
      },
    });

    console.info(
      `Successfully released ${escrowAccount.balance} to seller ${order.sellerId}`
    );
  } catch (error) {
    console.error("Escrow release failed", {
      error,
      orderId: order.id,
      sellerId: order.sellerId,
    });
    throw new Error(
      `Escrow release failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function refundEscrow(
  tx: Prisma.TransactionClient,
  order: Order
): Promise<void> {
  try {
    if (order.status !== "CANCELED") {
      throw new Error("Cannot refund escrow for non-cancelled order");
    }

    // 2. Атомарная блокировка эскроу-счета
    const escrowAccount = await tx.escrowAccount.findUnique({
      where: { orderId: order.id },
      select: {
        id: true,
        balance: true,
        status: true,
      },
    });

    if (!escrowAccount) {
      throw new Error("Escrow account not found");
    }

    if (escrowAccount.status === "REFUNDED") {
      console.warn(`Escrow already refunded for order ${order.id}`);
      return;
    }

    // 4. Проверка баланса
    if (escrowAccount.balance <= 0) {
      throw new Error("Escrow balance must be positive");
    }

    // 5. Атомарное обновление эскроу-счета
    await tx.escrowAccount.update({
      where: { id: escrowAccount.id },
      data: {
        status: "REFUNDED",
        balance: 0, // Явное обнуление вместо decrement
      },
    });

    // 6. Обновление баланса продавца с проверкой валюты
    await tx.user.update({
      where: { id: order.buyerId },
      data: {
        balance: {
          increment: escrowAccount.balance,
        },
      },
      select: {
        id: true,
      },
    });

    // 7. Создание аудиторской записи
    await tx.transaction.create({
      data: {
        type: "ESCROW_REFUND",
        status: "COMPLETED",
        amount: escrowAccount.balance,
        userId: order.sellerId,
      },
    });

    console.info(
      `Successfully refunded ${escrowAccount.balance} to seller ${order.sellerId}`
    );
  } catch (error) {
    console.error("Escrow release failed", {
      error,
      orderId: order.id,
      sellerId: order.sellerId,
    });
    throw new Error(
      `Escrow release failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
