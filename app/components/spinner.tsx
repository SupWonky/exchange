import { LoaderIcon } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <LoaderIcon className={`animate-spin ${className}`} />;
}
