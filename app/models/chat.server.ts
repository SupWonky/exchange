import { Chat, Media, Message, User } from "@prisma/client";
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
  return prisma.chat
    .findUniqueOrThrow({
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
}

export async function createChat({
  participants,
}: {
  participants: User["id"][];
}) {
  const result = participants.map((item) => ({ id: item }));
  return prisma.chat.create({
    data: {
      participants: {
        connect: result,
      },
    },
    include: {
      participants: true,
    },
  });
}

export async function createMessage({
  content,
  chatId,
  senderId,
  attachments,
}: Pick<Message, "content" | "chatId" | "senderId"> & {
  attachments: Pick<Media, "url" | "name" | "type">[];
}) {
  return prisma.chat.update({
    data: {
      messages: {
        create: {
          content,
          senderId,
          attachments: {
            create: attachments,
          },
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

export async function getChatByUsers({
  participants,
}: {
  participants: User["id"][];
}) {
  return prisma.chat.findFirst({
    where: {
      AND: [
        { participants: { some: { id: { equals: participants[0] } } } },
        { participants: { some: { id: { equals: participants[1] } } } },
      ],
    },
    include: { participants: true },
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
