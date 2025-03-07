import { Chat, Message, User } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getChatById(id: Chat["id"]) {
  return prisma.chat.findUnique({
    where: {
      id,
    },
    include: {
      participants: true,
    },
  });
}

export async function getChatMessages({
  chatId,
  page,
  limit = 15,
}: {
  chatId: Chat["id"];
  page: number;
  limit?: number;
}) {
  const messages = await prisma.chat
    .findUnique({
      where: {
        id: chatId,
      },
    })
    .messages({
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  return messages?.reverse();
}

export async function createChat({
  participants,
}: {
  participants: Pick<User, "id">[];
}) {
  return prisma.chat.create({
    data: {
      participants: {
        connect: participants,
      },
    },
  });
}

export async function createMessage({
  content,
  chatId,
  senderId,
}: Pick<Message, "content" | "chatId" | "senderId">) {
  return prisma.chat.update({
    data: {
      messages: {
        create: {
          content,
          senderId,
        },
      },
      updatedAt: new Date(Date.now()),
    },
    where: {
      id: chatId,
    },
  });
}

export async function getChatsByUser(userId: User["id"]) {
  return prisma.user
    .findUnique({
      where: { id: userId },
    })
    .chats({
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        participants: {
          where: {
            id: { not: userId },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        order: null,
      },
    });
}

export async function getOrdersChatByUser(userId: User["id"]) {
  return prisma.user
    .findUnique({
      where: {
        id: userId,
      },
    })
    .chats({
      include: {
        order: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 5,
          where: {
            isSystemMessage: false,
          },
        },
      },
      where: {
        order: { isNot: null },
      },
      orderBy: { order: { createdAt: "desc" } },
    });
}
