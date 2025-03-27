// app/components/search-input.tsx
import { useNavigate } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Spinner } from "./spinner";

export function SearchInput() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Handle search navigation
  useEffect(() => {
    if (query) {
      setIsLoading(true);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      // Simulate loading state for demo
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [query]);

  return (
    <div className="relative w-full max-w-xs flex-1 md:flex-none">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Найти услугу..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex h-8 w-full rounded-md border bg-transparent px-10 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Search services"
        />

        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
