import { MainNav } from "./main-nav";
import { SearchInput } from "./search-input";
import { User } from "./user";

export function SiteHeader() {
  return (
    <header className="top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav />
        <SearchInput />
        <div className="flex flex-1 items-center justify-between md:justify-end">
          <User />
        </div>
      </div>
    </header>
  );
}

export function SellerHeader() {
  return (
    <header className="top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav />
        <SearchInput />
        <div className="flex flex-1 items-center justify-between md:justify-end">
          <User />
        </div>
      </div>
    </header>
  );
}
