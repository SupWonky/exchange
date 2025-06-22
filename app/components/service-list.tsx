import { useFetcher, useSearchParams } from "@remix-run/react";
import { Button } from "./ui/button";
import * as React from "react";
import { ServiceCard } from "./service-card";
import { Loader2 } from "lucide-react";
import { Media, PricingTier, Service, User, UserInfo } from "@prisma/client";
import { formatRating } from "~/utils";
import { loader } from "~/routes/api.v1.feed";

type ServiceListProps = (
  | { categoryId: string; query?: never }
  | { categoryId?: never; query?: string }
) & {
  limit?: number;
  initServices: ServiceType[];
};

type ServiceType = Service & {
  media: Media[];
  pricingTier: PricingTier[];
  user: User & {
    userInfo: UserInfo | null;
    avatar: Media | null;
  };
};

export function ServiceList({
  initServices,
  categoryId,
  query,
  limit = 6,
}: ServiceListProps) {
  const [searchParams] = useSearchParams();
  const [services, setServices] = React.useState(initServices);
  const [cursor, setCursor] = React.useState<string | null>(
    initServices.length === limit
      ? initServices[initServices.length - 1].id
      : null
  );
  const fetcher = useFetcher<typeof loader>();

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
  }, [initServices]);

  function loadMore() {
    if (!cursor || fetcher.state === "loading") return;
    const params = new URLSearchParams(searchParams);

    if (categoryId) {
      params.set("categoryId", categoryId);
    }

    if (query) {
      params.set("q", query);
    }

    params.set("cursor", cursor);

    fetcher.load(`/api/v1/feed?${params.toString()}`);
  }

  return (
    <div className="flex flex-col">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {services.map(({ id, title, slug, media, pricingTier, user }) => (
          <ServiceCard
            title={title}
            url={`/services/${slug}`}
            imageUrl={
              media.at(0)?.url ||
              "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
            }
            price={pricingTier.find((v) => v.variant === "BASIC")?.price || 500}
            user={{
              id: user.id,
              name: user.name,
              avgRating: formatRating(
                user.userInfo?.reviewCount,
                user.userInfo?.reviewPositive
              ),
              reviewCount: user.userInfo ? user.userInfo.reviewCount : 0,
              avatar: user.avatar,
            }}
            key={id}
          />
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
