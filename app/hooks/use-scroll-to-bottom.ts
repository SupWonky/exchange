import { useEffect, useRef } from "react";

export function useScrollToBottom(
  action: () => any,
  threshold = 300,
  waitMs = 500,
  triggerOnce = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const handleScroll = () => {
      if (triggerOnce && hasTriggeredRef.current) {
        return;
      }

      const documentHeight = document.documentElement.scrollHeight;
      const distanceFromBottom =
        documentHeight - (window.innerHeight + window.scrollY);

      if (distanceFromBottom <= threshold) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          action();

          if (triggerOnce) {
            hasTriggeredRef.current = true;

            window.removeEventListener("scroll", handleScroll);
          }
        }, waitMs);
      }
    };

    hasTriggeredRef.current = false;

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [waitMs, triggerOnce]);
}
