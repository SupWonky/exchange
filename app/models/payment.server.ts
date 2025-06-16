import { Transaction, User } from "@prisma/client";
import { prisma } from "~/db.server";

export async function topupBalance({
  userId,
  amount,
  transactionId,
}: {
  userId: User["id"];
  transactionId?: Transaction["id"];
  amount: number;
}) {
  prisma.$transaction([
    prisma.user.update({
      data: { balance: { increment: amount } },
      where: { id: userId },
    }),
    prisma.transaction.update({
      data: { status: "COMPLETED" },
      where: { id: transactionId },
    }),
  ]);
}

export async function createTransaction({
  amount,
  status,
  type,
  userId,
}: Pick<Transaction, "amount" | "status" | "type" | "userId">) {
  return prisma.transaction.create({
    data: {
      amount,
      status,
      type,
      user: { connect: { id: userId } },
    },
  });
}

export async function getTransactionById(id: Transaction["id"]) {
  return prisma.transaction.findUnique({
    where: { id },
  });
}
