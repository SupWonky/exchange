import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getTransactionById, topupBalance } from "~/models/payment.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;

  const result = searchParams.get("result") ?? "fail";
  const paymentId = searchParams.get("clientid");

  if (!paymentId) {
    return redirect("/");
  }

  if (result === "success") {
    const transaction = await getTransactionById(paymentId);

    if (!transaction) {
      throw new Response("Not Found", { status: 404 });
    }

    await topupBalance({
      userId,
      transactionId: transaction.id,
      amount: transaction.amount,
    });
  }

  return redirect("/");
};
