import { ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { viewService } from "~/models/service.server";

export const action = async ({ params }: ActionFunctionArgs) => {
  invariant(params.id);

  await viewService(params.id);

  return { success: true };
};
