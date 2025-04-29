import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Link, LinkProps } from "@remix-run/react";
import { cn } from "~/lib/utils";
import { siteConfig } from "~/config/site";
import { ChevronRightIcon } from "lucide-react";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

interface NavItemBase {
  label: string;
  url: string;
}

interface NavLink extends NavItemBase {
  type: "link";
}

interface NavSubmenu extends NavItemBase {
  type: "submenu";
  items: NavItem[];
}

type NavItem = NavLink | NavSubmenu;

const defaultMenu: NavItem[] = [
  {
    type: "submenu",
    label: "Services",
    url: "/services",
    items: [
      { type: "link", label: "Web Development", url: "/services/web-dev" },
      { type: "link", label: "UI/UX Design", url: "/services/design" },
      {
        type: "submenu",
        label: "Mobile Apps",
        url: "/services/mobile-apps",
        items: [
          {
            type: "link",
            label: "iOS Development",
            url: "/services/mobile-apps/ios",
          },
          {
            type: "link",
            label: "Android Development",
            url: "/services/mobile-apps/android",
          },
          {
            type: "link",
            label: "Cross-platform",
            url: "/services/mobile-apps/cross-platform",
          },
        ],
      },
      { type: "link", label: "Cloud Solutions", url: "/services/cloud" },
    ],
  },
  { type: "link", label: "About Us", url: "/about" },
  { type: "link", label: "Portfolio", url: "/portfolio" },
  {
    type: "submenu",
    label: "Resources",
    url: "/resources",
    items: [
      { type: "link", label: "Blog", url: "/resources/blog" },
      { type: "link", label: "Case Studies", url: "/resources/case-studies" },
      { type: "link", label: "Guides", url: "/resources/guides" },
    ],
  },
  { type: "link", label: "Contact", url: "/contact" },
];

export function Sidebar({
  items = defaultMenu,
  className,
}: {
  items?: NavItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<NavItem[][]>([items]);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    if (!open) {
      setLevels([items]);
      setCurrentLevel(0);
    }
  }, [open, items]);

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
          <MobileLink to="/" onOpenChange={setOpen}>
            <span className="font-bold">{siteConfig.name}</span>
          </MobileLink>
        </SheetTitle>

        <div
          className="flex flex-1 transition-transform will-change-transform ease-in-out duration-300 h-full"
          style={{
            transform: `translateX(-${currentLevel * 100}%)`,
          }}
        >
          {levels.map((levelItems, index) => (
            <div
              key={index}
              className="w-full bg-white flex-shrink-0 overflow-y-auto"
            >
              {index > 0 && (
                <button
                  onClick={() => setCurrentLevel(index - 1)}
                  className="flex items-center text-sm p-4 border-b w-full"
                >
                  <ArrowLeftIcon className="mr-3 size-5" />
                  <span>Назад</span>
                </button>
              )}
              <div className="flex flex-col">
                {levelItems.map((item) => (
                  <div key={item.url}>
                    {item.type === "link" ? (
                      <MobileLink
                        to={item.url}
                        onOpenChange={setOpen}
                        className="flex w-full py-3 px-4 border-b border-border hover:bg-accent text-sm transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </MobileLink>
                    ) : (
                      <button
                        onClick={() => {
                          setLevels((prev) => [...prev, item.items]);
                          setCurrentLevel(index + 1);
                        }}
                        className="flex w-full items-center justify-between py-3 px-4 border-border border-b hover:bg-accent text-sm transition-colors"
                      >
                        <span>{item.label}</span>
                        <ChevronRightIcon className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
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
    <Link to={to} className={cn("block", className)} {...props}>
      {children}
    </Link>
  );
}
