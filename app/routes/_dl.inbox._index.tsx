import { Send } from "lucide-react";

export default function InboxIndex() {
  return (
    <div className="flex-1 hidden md:block">
      <div className="flex h-full flex-col gap-1.5 items-center justify-center bg-background">
        <div className="bg-blue-400/15 w-32 h-32 flex items-center justify-center rounded-full">
          <Send strokeWidth={1} className="h-16 w-16 text-blue-500" />
        </div>
        <p className="font-medium text-lg text-muted-foreground">
          Выберите собеседника
        </p>
      </div>
    </div>
  );
}
