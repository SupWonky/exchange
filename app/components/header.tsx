import { MainNav } from "./main-nav";
import { Input } from "./ui/input";
import { User } from "./user";

export function SiteHeader() {
  return (
    <header className="top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="w-full flex-1 md:w-auto md:flex-none">
          <Input placeholder="Найти услугу..." type="text" className="h-8" />
        </div>
        <div className="flex flex-1 items-center justify-between md:justify-end">
          <User />
        </div>
      </div>
    </header>
  );
}
