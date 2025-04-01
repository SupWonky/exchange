// app/components/search-input.tsx
import { Form, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

export function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  const defaultValue = searchParams.get("q") || "";

  // Keyboard shortcut (Ctrl+K/Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-xs flex-1 md:flex-none">
      <Form
        method="get"
        action="search"
        // onChange={(e) => submit(e.currentTarget)}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          ref={inputRef}
          type="search"
          placeholder="Найти услугу..."
          className="flex h-8 w-full rounded-md border bg-transparent px-10 py-2 shadow-sm transition-colors"
          aria-label="Search services"
          defaultValue={defaultValue}
        />

        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Form>
    </div>
  );
}
