import { requireUserId } from "~/session.server";
import { User, Settings } from "lucide-react";
import { Link } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return {};
};

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="shadow bg-background dark:bg-muted/40 md:rounded-xl mt-12 mb-6 relative">
        <h1 className="text-xl font-semibold p-4 border-b">Настройки</h1>

        <div className="divide-y">
          {/* Блог (Blog) */}
          <div className="p-1">
            <Link
              to="blog"
              className="flex items-start hover:bg-muted rounded-xl p-3"
            >
              <div className="mt-1 mr-3">
                <User size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base font-medium">Профиль</h2>
                <p className="text-sm text-muted-foreground">
                  Название, Описнаие
                </p>
              </div>
            </Link>
          </div>

          {/* Ленты (Feeds) */}
          {/* <div className="p-4">
            <Link to="feeds" className="flex items-start">
              <div className="mt-1 mr-3">
                <Rss size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base font-medium">Ленты</h2>
                <p className="text-sm text-muted-foreground">
                  Настройки лент, Фильтрация, Заблокированные
                </p>
              </div>
            </Link>
          </div> */}

          {/* Основные (General) */}
          {/* <div className="p-1">
            <Link
              to="general"
              className="flex items-start hover:bg-muted rounded-xl p-3"
            >
              <div className="mt-1 mr-3">
                <Settings size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base font-medium">Основные</h2>
                <p className="text-sm text-muted-foreground">
                  Способы входа, Удалить аккаунт
                </p>
              </div>
            </Link>
          </div> */}

          {/* Уведомления (Notifications) */}
          {/* <div className="p-4">
            <Link to="notifications" className="flex items-start">
              <div className="mt-1 mr-3">
                <Bell size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base font-medium">Уведомления</h2>
                <p className="text-sm text-muted-foreground">
                  Уведомления, Письма
                </p>
              </div>
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
