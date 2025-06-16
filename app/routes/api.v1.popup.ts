import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs } from "@remix-run/node";
import { PopupSchema } from "~/constants/schemas";
import { createTransaction } from "~/models/payment.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: PopupSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { sum } = submission.value;

  const transaction = await createTransaction({
    amount: sum,
    status: "PENDING",
    type: "DEPOSIT",
    userId,
  });

  return { transaction };
};
