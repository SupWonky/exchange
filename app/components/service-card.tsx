import { Link } from "@remix-run/react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { HeartIcon, StarIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatCurrency } from "~/lib/utils";

interface ServiceCardProps {
  title: string;
  url: string;
  imageUrl: string;
  price: number;

  user: {
    id: string;
    name: string;
    avgRating: string;
    reviewCount: number;
    avatar: {
      url: string;
    } | null;
  };
}

export function ServiceCard({
  title,
  url,
  imageUrl,
  price,
  user,
}: ServiceCardProps) {
  const fallback = user.name.charAt(0).toUpperCase();

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg rounded-lg">
      <div className="relative border-b box-border">
        <Link
          to={url}
          target="_blank"
          className="block overflow-hidden aspect-[5/3]"
          prefetch="intent"
        >
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-auto"
          />
        </Link>

        <button className="absolute top-3 right-3 p-1.5 bg-black/40 rounded-full transition-colors text-white hover:text-red-500">
          <HeartIcon className="h-4 w-4" />
        </button>
      </div>

      <CardHeader className="px-4 py-3 border-b h-[73px]">
        <Link
          to={url}
          target="_blank"
          rel="noreferrer"
          className="block"
          prefetch="intent"
        >
          <h3 className="text-base line-clamp-2 text-ellipsis">{title}</h3>
        </Link>
      </CardHeader>

      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to={`/user/${user.id}`} className="shrink-0">
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={user.avatar?.url} alt={user.name} />
              <AvatarFallback className="bg-primary/10">
                {fallback}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col gap-0.5">
            <Link
              to={`/user/${user.id}`}
              className="hover:underline font-medium text-sm truncate max-w-40"
            >
              {user.name}
            </Link>
            <div className="flex items-center text-xs">
              <StarIcon className="w-3.5 h-3.5 shrink-0 stroke-transparent fill-yellow-500 mr-1" />
              <span className="font-semibold text-yellow-500">
                {user.avgRating}
              </span>
              <span className="text-muted-foreground ml-1">{`(${user.reviewCount})`}</span>
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
