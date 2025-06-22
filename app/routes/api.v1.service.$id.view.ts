import { ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { serviceManager } from "~/models/service.server";

export const action = async ({ params }: ActionFunctionArgs) => {
  invariant(params.id);

  await serviceManager.view(params.id);

  return { success: true };
};
