import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, NavLink, useLoaderData } from "@remix-run/react";
import { Edit2, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { getServiceListByUser } from "~/models/service.server";
import { getUser } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  if (!user) {
    return redirect("/login?redirectTo=/services/published");
  }

  const services = await getServiceListByUser({
    userId: user.id,
    status: "PUBLISHED",
  });

  return { services };
};

export default function ManageServicesAllPage() {
  const { services } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мои услуги</h1>
          <p className="mt-1 text-gray-500">
            Управляйте вашими услугами и черновиками
          </p>
        </div>
        <Button asChild className="pr-6 gap-2">
          <Link to="/services/new">
            <Plus className="h-5 w-5" />
            Добавить услугу
          </Link>
        </Button>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-200 mb-8">
        <div className="flex gap-8 -mb-px">
          <NavLink
            to="/services"
            end
            className={({ isActive }) =>
              `py-4 px-1 border-b-2 text-sm font-medium ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`
            }
          >
            Черновики
          </NavLink>
          <NavLink
            to="/services/published"
            end
            className={({ isActive }) =>
              `py-4 px-1 border-b-2 text-sm font-medium ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`
            }
          >
            Опубликованные
          </NavLink>
        </div>
      </nav>

      {/* Empty State */}
      {services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет черновиков
            </h3>
            <p className="text-gray-500 text-center mb-6">
              Создайте свою первую услугу, чтобы начать привлекать клиентов
            </p>
            <Button asChild>
              <Link to="/services/new" className="gap-2">
                <Plus className="h-4 w-4" />
                Создать услугу
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Services Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {services.map((service) => (
            <Card
              key={service.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:gap-8">
                  {/* Image Container */}
                  <div className="relative rounded-lg overflow-hidden aspect-video md:w-1/4 flex-shrink-0">
                    <img
                      src={
                        service.media[0]?.url ??
                        "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                      }
                      alt={service.title}
                      className="w-full h-auto object-cover"
                    />
                    <Badge className="absolute top-2 left-2">
                      Опубликованно
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <time
                        className="text-sm text-gray-500"
                        dateTime={service.createdAt.toISOString()}
                      >
                        Создан:{" "}
                        {new Date(service.createdAt).toLocaleDateString(
                          new Intl.Locale("ru-RU")
                        )}
                      </time>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end mt-4 pt-4 border-t">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Link to={`/services/new?id=${service.id}`}>
                          <Edit2 className="h-4 w-4" />
                          Редактировать
                        </Link>
                      </Button>

                      <Form method="post" className="flex">
                        <input
                          type="hidden"
                          name="serviceId"
                          value={service.id}
                        />
                        <Button
                          type="submit"
                          name="intent"
                          value="delete"
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </Button>
                      </Form>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
