import { Link, useFetcher } from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { StarIcon, HeartIcon, Loader2 } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import * as React from "react";
import { getServiceItemsByCategory } from "~/models/service.server";

type ServiceType = Awaited<ReturnType<typeof getServiceItemsByCategory>>[0];

export function ServiceList({
  initServices,
  categoryId,
  limit = 6,
}: {
  initServices: ServiceType[];
  categoryId: string;
  limit?: number;
}) {
  const [services, setServices] = React.useState(initServices);
  const [cursor, setCursor] = React.useState<string | null>(
    initServices.length === limit
      ? initServices[initServices.length - 1].id
      : null
  );
  const fetcher = useFetcher<ServiceType[]>();

  React.useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const newServices = fetcher.data;

      if (newServices.length === 0) {
        setCursor(null);
      } else {
        setServices((prev) => [...prev, ...newServices]);

        if (newServices.length < limit) {
          setCursor(null);
        } else {
          setCursor(newServices[newServices.length - 1].id);
        }
      }
    }
  }, [fetcher.data, fetcher.state, limit]);

  React.useEffect(() => {
    setServices(initServices);
    setCursor(
      initServices.length === limit
        ? initServices[initServices.length - 1].id
        : null
    );
  }, [initServices, limit]);

  function loadMore() {
    if (!cursor || fetcher.state === "loading") return;
    fetcher.load(`/feed?cursor=${cursor}&categoryId=${categoryId}`);
  }

  return (
    <div className="flex flex-col">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard service={service} key={service.id} />
        ))}
      </div>

      {cursor && (
        <Button
          onClick={loadMore}
          className="mt-4 mx-auto"
          size="lg"
          variant="outline"
          disabled={fetcher.state === "loading"}
        >
          {fetcher.state === "loading" ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Подождите...
            </>
          ) : (
            "Показать ещё"
          )}
        </Button>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceType }) {
  const fallback = service.user.name.charAt(0).toUpperCase();
  const basicVarinat = service.pricingTier.find((v) => v.variant === "BASIC");
  const price = basicVarinat ? basicVarinat.price : 500;
  const image = service.media.at(0);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg rounded-lg">
      <div className="relative">
        <Link
          to={`/services/${service.slug}`}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden aspect-[5/3]"
        >
          <img
            src={
              image
                ? image.url
                : "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
            }
            alt={service.title}
            className="object-cover w-full h-full"
          />
        </Link>

        {/* {service.featured && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-white/90 text-primary font-semibold"
          >
            Featured
          </Badge>
        )} */}

        <button className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur rounded-full transition-colors text-white hover:text-red-500">
          <HeartIcon className="h-4 w-4" />
        </button>
      </div>

      <CardHeader className="px-4 py-3 border-b h-[73px]">
        <Link
          to={`/services/${service.slug}`}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <h3 className="text-base line-clamp-2 text-ellipsis">
            {service.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to={`/user/${service.user.id}`} className="shrink-0">
            <Avatar className="h-8 w-8 border">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt={service.user.name}
              />
              <AvatarFallback className="bg-primary/10">
                {fallback}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col gap-0.5">
            <Link
              to={`/user/${service.user.id}`}
              className="hover:underline font-medium text-sm truncate max-w-40"
            >
              {service.user.name}
            </Link>
            <div className="flex items-center text-xs">
              <StarIcon className="w-3.5 h-3.5 shrink-0 stroke-transparent fill-yellow-500 mr-1" />
              <span className="font-semibold">{service.averageRating}</span>
              <span className="text-muted-foreground ml-1">{`(${service.totalReviews})`}</span>
            </div>
          </div>

          <div className="ml-auto">
            <span className="text-lg text-primary font-bold tabular-nums">
              {formatCurrency(price)}
              <span className="text-base ml-1">₽</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
