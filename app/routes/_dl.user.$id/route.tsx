import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getServiceListByUser } from "~/models/service.server";
import { getUserById } from "~/models/user.server";
import { ProfileCard, ReviewCard } from "./profile";
import { ServiceCard } from "~/components/service-card";
import { getReviewsForUser } from "~/models/review.server";
import { formatRating } from "~/utils";
import { siteConfig } from "~/config/site";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.id, "Not Found");

  const user = await getUserById(params.id);

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  const services = await getServiceListByUser({
    userId: user.id,
    status: "PUBLISHED",
  });

  const reviews = await getReviewsForUser(user.id);

  return { user, services, reviews };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.user.name} - ${siteConfig.name}` },
    { property: "description", content: data?.user.bio },
  ];
};

export default function UserPage() {
  const { user, services, reviews } = useLoaderData<typeof loader>();
  const [showReviews, setShowReviews] = useState(false);
  const [showServices, setShowServices] = useState(false);

  const visibleServices = showServices ? services : services.slice(0, 8);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <ProfileCard user={user} />

        {services.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Мои кворки</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleServices.map((service) => {
                const image = service.media.at(0);

                return (
                  <ServiceCard
                    key={service.id}
                    title={service.title}
                    url={`/services/${service.slug}`}
                    imageUrl={
                      image
                        ? image.url
                        : "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                    }
                    price={
                      service.pricingTier.find(
                        (item) => item.variant === "BASIC"
                      )?.price || 500
                    }
                    user={{
                      id: user.id,
                      name: user.name,
                      avgRating: formatRating(
                        user.userInfo?.reviewCount,
                        user.userInfo?.reviewPositive
                      ),
                      reviewCount: user.userInfo
                        ? user.userInfo.reviewCount
                        : 0,
                      avatar: user.avatar,
                    }}
                  />
                );
              })}
            </div>

            {services.length > 8 && !showServices && (
              <div className="flex items-center pt-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="mx-auto"
                  onClick={() => setShowServices(true)}
                >
                  Показать ещё
                </Button>
              </div>
            )}
          </section>
        )}

        {reviews.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Мои отзывы</h2>
            <div className="space-y-4">
              {showReviews
                ? reviews.map((review, idx) => (
                    <ReviewCard key={idx} review={review} />
                  ))
                : reviews
                    .slice(0, 6)
                    .map((review, idx) => (
                      <ReviewCard key={idx} review={review} />
                    ))}
            </div>

            {reviews.length > 6 && !showReviews && (
              <div className="flex items-center pt-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="mx-auto"
                  onClick={() => setShowReviews(true)}
                >
                  Показать ещё
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
