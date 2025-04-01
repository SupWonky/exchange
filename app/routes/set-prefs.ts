import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs } from "@remix-run/node";
import { UserPrefs } from "~/constants/schemas";
import { createUserCookie } from "~/lib/user.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema: UserPrefs });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { role } = submission.value;

  return createUserCookie({
    request,
    role,
    //  redirectTo: role === "buyer" ? "/buyer" : "/seller",
  });
};
