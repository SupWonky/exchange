import { CheckCircle2, Clock, Phone, Star } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { formatRating } from "~/utils";

// --- Types ---
export interface User {
  id: string;
  name: string;
  verified: boolean;
  role: string | null;
  skills: string[];
  avatar: {
    url: string;
  } | null;
  userInfo: {
    reviewCount: number;
    reviewPositive: number;
    repeatBuyerRatio: number;
    orderCanceled: number;
    orderCompleted: number;
    orderQueue: number;
  } | null;
  bio: string | null;
}

export interface Gig {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
}

export interface Review {
  id: string;
  recommend: boolean;
  user: {
    name: string;
  };
  comment: string | null;
  createdAt: Date;
}

export function ProfileCard({ user }: { user: User }) {
  return (
    <div className="bg-white rounded-2xl shadow border overflow-hidden flex flex-col md:flex-row">
      <div className="flex-1 flex pb-6 pt-4 pl-6">
        <div className="flex-initial">
          <img
            src={user.avatar?.url}
            alt="Avatar"
            className="size-48 rounded-lg"
          />
          <div>
            <h1 className="font-semibold text-base mt-2">{user.name}</h1>
          </div>

          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className=" text-indigo-500 size-5" />
              <span>Личность подтверждена</span>
            </div>

            <div className="flex items-start gap-1.5">
              <Phone className="size-5" />
              <span>Телефон подтвержден</span>
            </div>

            <div className="flex items-start gap-1.5">
              <Clock className="size-5" />
              <span> На сайте с 29 сентября 2016</span>
            </div>
          </div>
        </div>
        <div className="flex-1 px-5 pb-6">
          <div className="text-3xl text-primary font-semibold">{user.name}</div>
          <div className="text-2xl font-semibold mt-2.5">{user.role}</div>
          <div className="text-sm mt-4">{user.bio}</div>
          {user.skills.length > 0 && (
            <div className="mt-6">
              <div className="text-base font-semibold">Навыки</div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {user.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="basis-72 border-l p-4 bg-muted">
        <div className="inline-flex items-center text-sm font-semibold whitespace-nowrap mb-4">
          <div className="inline-flex items-center gap-1 mr-2 w-12 text-right">
            <Star className="stroke-none fill-yellow-500 size-5" />
            <span className="text-yellow-500 text-lg leading-5">
              {formatRating(
                user.userInfo?.reviewCount,
                user.userInfo?.reviewPositive
              )}
            </span>
          </div>
          Продавец
        </div>

        <div className="space-y-2">
          <div className="whitespace-nowrap text-sm">
            <span className="text-primary font-semibold text-lg inline-block mr-2 w-12 text-right">
              {user.userInfo
                ? (user.userInfo.orderCompleted /
                    (user.userInfo.orderCanceled +
                      user.userInfo.orderCompleted)) *
                    100 || 0
                : 0}
              %
            </span>
            заказов успешно сдано
          </div>
          <div className="whitespace-nowrap text-sm">
            <span className="text-primary font-semibold text-lg inline-block mr-2 w-12 text-right">
              {user.userInfo ? user.userInfo.repeatBuyerRatio * 100 : 0}%
            </span>
            повторных заказов
          </div>
          <div className="whitespace-nowrap text-sm">
            <span className="text-primary font-semibold text-lg inline-block mr-2 w-12 text-right">
              {user.userInfo?.orderCompleted}
            </span>
            заказов выполнено
          </div>
          <div className="whitespace-nowrap text-sm">
            <span className="text-primary font-semibold text-lg inline-block mr-2 w-12 text-right">
              {user.userInfo ? user.userInfo.orderQueue : 0}
            </span>
            заказов в работе
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-2">
      <p className="font-medium">{review.user.name}</p>
      <p className="text-gray-700 text-sm">{review.comment}</p>
      <p className="text-gray-500 text-xs">
        {review.createdAt.toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
