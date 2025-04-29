import { Form, Link, NavLink, useFetcher } from "@remix-run/react";

import { useOptionalPrefs, useOptionalUser } from "~/utils";

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Wallet } from "lucide-react";
import { useModal } from "./providers/modal-provider";

const links = {
  seller: [
    { url: "/services", label: "Услуги" },
    { url: "/orders", label: "Заказы" },
    { url: "/exchange", label: "Биржа" },
    { url: "/inbox", label: "Чат" },
  ],
  buyer: [
    { url: "/orders", label: "Заказы" },
    { url: "/projects", label: "Проекты" },
    { url: "/inbox", label: "Чат" },
  ],
};

export function User() {
  const user = useOptionalUser();
  const prefs = useOptionalPrefs();
  const { setModal } = useModal();

  const role = prefs?.role || "buyer";
  const fecther = useFetcher();

  const updateRole = (role: "buyer" | "seller") => {
    const fromData = new FormData();
    fromData.set("role", role);
    fecther.submit(fromData, {
      method: "post",
      action: "/set-prefs",
      preventScrollReset: true,
    });
  };

  if (user) {
    return (
      <div className="flex flex-row items-center gap-6">
        <div className="space-x-8 hidden min-[800px]:flex">
          {links[role].map((link, idx) => (
            <NavLink
              to={link.url}
              className={({ isActive }) =>
                `transition-colors ${
                  isActive ? "text-indigo-500" : ""
                } hover:text-indigo-500`
              }
              key={idx}
            >
              {link.label}
            </NavLink>
          ))}

          <button
            onClick={() => setModal("balance")}
            className=" transition-colors text-primary hover:text-indigo-500 flex items-center gap-1"
          >
            <Wallet className="h-4 w-4" />
            <span className="font-medium">{user.balance} ₽</span>
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              type="button"
            >
              <Avatar className="h-9 w-9 border-2 border-indigo-100">
                <AvatarFallback className="bg-indigo-50 text-indigo-700">
                  {user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex rounded-md overflow-hidden border">
              <button
                name="role"
                value="buyer"
                className={`flex items-center justify-center gap-1.5 flex-1 text-sm py-1.5 ${
                  role === "buyer"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                disabled={role === "buyer"}
                onClick={() => updateRole("buyer")}
              >
                Я покупатель
              </button>
              <button
                name="role"
                value="seller"
                className={`flex items-center justify-center gap-1.5 flex-1 text-sm py-1.5 ${
                  role === "seller"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                disabled={role === "seller"}
                onClick={() => updateRole("seller")}
              >
                Я продавец
              </button>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Профиль</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Настройки</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutDropdownMenuButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button type="button" onClick={() => setModal("auth/login")}>
      Войти
    </Button>
  );
}

function LogoutDropdownMenuButton() {
  return (
    <Form method="post" action="/logout">
      <DropdownMenuItem asChild>
        <button className="w-full" type="submit">
          Выйти
        </button>
      </DropdownMenuItem>
    </Form>
  );
}
