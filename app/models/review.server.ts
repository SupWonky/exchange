import { User } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getReviewsForUser(userId: User["id"]) {
  return prisma.review.findMany({
    where: {
      service: { userId },
    },
    include: {
      user: true,
    },
  });
}

// export async function placeReview({
//   serviceId,
//   comment,
//   recommend,
//   userId,
// }: Pick<Review, "serviceId" | "comment" | "recommend" | "userId">) {
//   return prisma.review.create({
//     data: {
//       serviceId,
//       comment,
//       recommend,
//       userId,
//     },
//   });
// }
