import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { PopupSchema } from "~/constants/schemas";
import { generateSign } from "~/lib/lava.server";
import { createTransaction } from "~/models/payment.server";
import { requireUserId } from "~/session.server";
import axios from "axios";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: PopupSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { amount } = submission.value;

  const transaction = await createTransaction({
    amount,
    status: "PENDING",
    userId,
    type: "DEPOSIT",
    reference: null,
  });

  const data = {
    wallet_to: process.env.LAVA_WALLET!,
    sum: amount,
    order_id: transaction.id,
  };

  const params = new URLSearchParams();
  const headers = {
    "Content-Type": "multipart/form-data",
    Authorization: process.env.LAVA_API_KEY!,
  };

  for (const [key, value] of Object.entries(data)) {
    params.append(key, value.toString());
  }

  const response = await axios.get("https://api.lava.ru/wallet/list", {
    headers,
  });

  console.log(headers, response.data);
  if (response.data.status === "error") {
    throw new Response("Internal Error", { status: 500 });
  }

  redirect(response.data.url);
};
