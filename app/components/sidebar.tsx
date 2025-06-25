import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Link, LinkProps } from "@remix-run/react";
import { cn } from "~/lib/utils";
import { siteConfig } from "~/config/site";
import { ChevronRightIcon } from "lucide-react";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { SidebarProvider, useSidebar } from "./providers/sidebar-provider";

interface NavItemBase {
  label: string;
  url: string;
}

interface NavLink extends NavItemBase {
  type: "item";
}

interface NavSubmenu extends NavItemBase {
  type: "nested";
  children: NavItem[];
}

type NavItem = NavLink | NavSubmenu;

export function Sidebar({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 p-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden",
            className
          )}
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="!size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9h16.5m-16.5 6.75h16.5"
            />
          </svg>
          <span className="sr-only">Открыть меню</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="opacity-[0.975] p-0 w-96 max-sm:w-full overflow-hidden"
      >
        <SheetTitle className="px-4 py-3 border-b">
          <MobileLink to="/" onOpenChange={setOpen} className="w-fit">
            <span className="font-bold">{siteConfig.name}</span>
          </MobileLink>
        </SheetTitle>
        <SidebarProvider>
          <SidebarRenderer items={items} onOpenChange={setOpen} />
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}

function SidebarRenderer({
  items,
  onOpenChange,
}: {
  items: NavItem[];
  onOpenChange: (open: boolean) => void;
}) {
  const { paths } = useSidebar();

  return (
    <div
      className="flex flex-col flex-1 transition-transform will-change-transform ease-in-out duration-500 h-full"
      style={{
        transform: `translateX(-${paths.length * 100}%)`,
      }}
    >
      {items.map((item, idx) => (
        <SidebarItem item={item} onOpenChange={onOpenChange} key={idx} />
      ))}
    </div>
  );
}

interface SidebarItemProps {
  item: NavItem;
  onOpenChange: (open: boolean) => void;
}

function SidebarItem({ item, onOpenChange }: SidebarItemProps) {
  const { navigate, navigateBack, paths } = useSidebar();
  const visible = paths.some((path) => path === item.url);

  if (item.type === "item") {
    return (
      <MobileLink
        to={item.url}
        onOpenChange={onOpenChange}
        className="flex w-full py-3 px-4 border-b border-border hover:bg-accent font-semibold text-sm transition-colors"
      >
        {item.label}
      </MobileLink>
    );
  }

  if (!item.children || item.children.length === 0) {
    return null;
  }

  return (
    <div className="w-full static block">
      <button
        onClick={() => navigate(item.url)}
        className="flex w-full items-center justify-between py-3 px-4 border-border font-semibold border-b hover:bg-accent text-sm transition-colors"
      >
        <span>{item.label}</span>
        <ChevronRightIcon className="size-4" />
      </button>
      <div
        className={cn(
          "absolute left-full top-0 w-full bg-white",
          visible ? "visible" : "hidden"
        )}
      >
        <button
          onClick={navigateBack}
          className="flex items-center text-sm p-4 border-b w-full font-semibold"
        >
          <ArrowLeftIcon className="mr-3 size-5" />
          <span>Назад</span>
        </button>

        <div className="flex flex-col">
          {item.children.map((child, idx) => (
            <SidebarItem item={child} onOpenChange={onOpenChange} key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MobileLinkProps extends LinkProps {
  onOpenChange: (open: boolean) => void;
}

function MobileLink({
  onOpenChange,
  className,
  children,
  to,
  ...props
}: MobileLinkProps) {
  return (
    <Link
      to={to}
      className={cn("block", className)}
      {...props}
      onClick={() => onOpenChange(false)}
    >
      {children}
    </Link>
  );
}
