import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { MessageCircle } from "lucide-react";
import { cn, formatRelativeTime } from "~/lib/utils";
import { getChatsByUser } from "~/models/chat.server";
import { getUser } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  if (!user) {
    return redirect("/login?redirectTo=/inbox");
  }

  const chatsOfUser = await getChatsByUser(user.id);

  return { chats: chatsOfUser, user: user };
};

export default function InboxLayout() {
  const { chats } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <div className="py-4">
      <div className="lg:rounded-xl overflow-hidden lg:shadow max-w-screen-lg mx-auto border flex flex-row w-full h-[80svh]">
        {/* Chat List Sidebar */}
        <div
          className={cn(
            "w-full md:max-w-xs lg:max-w-sm md:border-r flex flex-col bg-background",
            !location.pathname.endsWith("/inbox") && "hidden md:block"
          )}
        >
          <div className="p-4 border-b">
            <h1 className="text-2xl font-semibold text-foreground">
              Сообщения
            </h1>
          </div>

          {chats?.length ? (
            <ul className="overflow-y-auto flex-1">
              {chats.map((chat) => {
                const lastMessage = chat.messages.at(0);
                const participant = chat.participants.at(0);

                return (
                  <li key={chat.id} className="border-b">
                    <NavLink
                      to={`/inbox/${chat.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors ${
                          isActive ? "bg-accent/20" : ""
                        }`
                      }
                    >
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        {/* Online status indicator */}
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold truncate">
                            {participant?.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(chat.updatedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage?.content || "Новое сообщение"}
                          </p>
                          {/* {chat.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                            {chat.unreadCount}
                          </span>
                        )} */}
                        </div>
                      </div>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 text-muted-foreground">
                <MessageCircle strokeWidth={1} className="mx-auto h-16 w-16" />
              </div>
              <h2 className="text-xl font-medium text-foreground mb-2">
                Здесь пусто...
              </h2>
              <p className="text-muted-foreground mb-6">
                Здесь будут отображаться ваши собеседники
              </p>
            </div>
          )}
        </div>

        {/* Chat Content Area */}
        <Outlet />
      </div>
    </div>
  );
}
