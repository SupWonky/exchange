import { Form, Link, NavLink } from "@remix-run/react";

import { useOptionalUser } from "~/utils";

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Wallet } from "lucide-react";

export function User() {
  const user = useOptionalUser();

  if (user) {
    return (
      <div className="flex flex-row items-center gap-6">
        <div className="space-x-8 flex">
          <NavLink
            className={({ isActive }) =>
              `transition-colors ${
                isActive ? "text-indigo-500" : ""
              } hover:text-indigo-500`
            }
            to="/services"
          >
            Услуги
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `transition-colors ${
                isActive ? "text-indigo-500" : ""
              } hover:text-indigo-500`
            }
            to="/orders"
          >
            Заказы
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `transition-colors ${
                isActive ? "text-indigo-500" : ""
              } hover:text-indigo-500`
            }
            to="/inbox"
          >
            Чат
          </NavLink>

          <Link
            to="?rmodal=balance"
            prefetch="intent"
            className=" transition-colors text-primary hover:text-indigo-500 flex items-center gap-1"
          >
            <Wallet className="h-4 w-4" />
            <span className="font-medium">{user.balance} ₽</span>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus:outline-none focus:ring-0 focus:ring-offset-0"
              type="button"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Профиль</DropdownMenuItem>
              <DropdownMenuItem>Настройки</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <LogoutDropdownMenuButton />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button asChild>
      <Link to="/login">Войти</Link>
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
