import { useFetcher } from "@remix-run/react";
import { useScrollToBottom } from "./use-scroll-to-bottom";

export function useMarkAsView({
  serviceId,
  userId,
}: {
  serviceId: string;
  userId?: string;
}) {
  const marker = useFetcher();
  const formData = new FormData();

  if (userId) {
    formData.append("userId", userId);
  }

  useScrollToBottom(() => {
    marker.submit(formData, {
      action: `/api/v1/service/${serviceId}/view`,
      method: "post",
    });
  });
}
