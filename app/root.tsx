import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import "~/tailwind.css";
import { getUser } from "./session.server";
import { ModalRouter } from "./components/modals/router";
import { ModalRoute } from "./components/modals/route";
import { BalanceModal } from "./components/modals/balance";
import { LoginDialog } from "./components/modals/login";
import { JoinDialog } from "./components/modals/join";
import { ModalProvider } from "./components/providers/modal-provider";
import { getUserPrefs } from "./lib/user.server";
import { TooltipProvider } from "./components/ui/tooltip";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap",
  },
  {
    rel: "icon",
    href: "/favicon.ico",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const prefs = await getUserPrefs(request);

  return { user, prefs };
};

export function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-svh bg-muted dark:bg-background font-sans antialiased flex flex-col">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function AppWithProviders() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <ModalProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>

      <ModalRouter>
        {user && (
          <ModalRoute path="balance" component={<BalanceModal user={user} />} />
        )}

        <ModalRoute
          path="auth/login"
          component={<LoginDialog />}
          conditional={!user}
        />
        <ModalRoute
          path="auth/join"
          component={<JoinDialog />}
          conditional={!user}
        />
      </ModalRouter>
    </ModalProvider>
  );
}
