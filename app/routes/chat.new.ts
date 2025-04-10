import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { ConversationSchema } from "~/constants/schemas";
import {
  createChat,
  createMessage,
  getChatByUsers,
} from "~/models/chat.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const fromData = await request.formData();
  const submission = parseWithZod(fromData, { schema: ConversationSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { initMessage, reciverId } = submission.value;
  const participants = [userId, reciverId];
  const existingChat = await getChatByUsers({ participants });

  if (existingChat) {
    return redirect(`/inbox/${existingChat.id}`);
  }

  const chat = await createChat({
    participants: [userId, reciverId],
  });

  await createMessage({
    content: initMessage,
    chatId: chat.id,
    senderId: userId,
  });

  return redirect(`/inbox/${chat.id}`);
};
