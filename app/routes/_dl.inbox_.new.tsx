// app/routes/inbox.new.tsx
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigation,
  useFetcher,
  Link,
} from "@remix-run/react";
import { getUser } from "~/session.server";
import { prisma } from "~/db.server";
import { Search } from "lucide-react";
import { Button } from "~/components/ui/button";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q") || "";

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        {
          OR: [
            { name: { contains: searchTerm } },
            { email: { contains: searchTerm } },
          ],
        },
      ],
    },
    take: 10,
  });

  return json({ users, searchTerm });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const formData = await request.formData();
  const participantId = formData.get("participantId");

  if (typeof participantId !== "string") {
    return json({ error: "Invalid participant" }, { status: 400 });
  }

  // Check if chat already exists
  const existingChat = await prisma.chat.findFirst({
    where: {
      AND: [
        { participants: { some: { id: user.id } } },
        { participants: { some: { id: participantId } } },
      ],
    },
    include: { participants: true },
  });

  if (existingChat) {
    return redirect(`/inbox/${existingChat.id}`);
  }

  // Create new chat
  const newChat = await prisma.chat.create({
    data: {
      participants: {
        connect: [{ id: user.id }, { id: participantId }],
      },
    },
  });

  return redirect(`/inbox/${newChat.id}`);
};

export default function NewChatDialog() {
  const { users, searchTerm } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigation = useNavigation();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">New Message</h2>

        <fetcher.Form method="get" action="/inbox/new">
          <div className="relative mb-4">
            <input
              type="search"
              name="q"
              placeholder="Search people..."
              className="w-full pl-10 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary"
              defaultValue={searchTerm}
              onChange={(e) => fetcher.submit(e.target.form)}
            />
            <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
          </div>
        </fetcher.Form>

        <Form method="post">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-accent/30 rounded-lg cursor-pointer"
              >
                <input
                  type="radio"
                  name="participantId"
                  value={user.id}
                  className="peer hidden"
                  required
                />
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="h-5 w-5 border-2 rounded-full peer-checked:border-primary peer-checked:bg-primary" />
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {`No users found matching ${searchTerm}`}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button asChild variant="destructive">
              <Link to="/inbox" className="btn btn-ghost" aria-label="Cancel">
                Cancel
              </Link>
            </Button>

            <Button
              type="submit"
              className="btn btn-primary"
              disabled={navigation.state !== "idle"}
            >
              {navigation.state === "submitting"
                ? "Creating..."
                : "Create Chat"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
