import { parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { PopupSchema } from "~/constants/schemas";
import { topupBalance } from "~/models/payment.server";
import { getUser } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  return { user };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema: PopupSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { amount } = submission.value;

  await topupBalance({ userId: user.id, amount });

  return null;
};

export default function Page() {
  return null;
}
