import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { PopupSchema } from "~/constants/schemas";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: PopupSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { amount } = submission.value;

  const body = {
    auth_login: process.env.PAYMENT_AUTH_LOGIN!,
    auth_secret: process.env.PAYMENT_AUTH_SECRET!,
    amount,
    type: "purchase",
    lifetime: 60,
    //amount_currency: "RUB",
  };

  console.log(body);

  const res = await fetch("https://api.crystalpay.io/v3/invoice/create", {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    method: "post",
  });
  const data = await res.json();

  if (data.error) {
    console.log(data);
    throw new Response("Internal Error", { status: 500 });
  }

  redirect(data.url);
};
