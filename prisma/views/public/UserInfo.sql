SELECT
  u.id AS "userId",
  revs."reviewCount",
  revs."reviewPositive",
  revs."reviewNegative",
  ords."orderQueue",
  ords."orderCompleted",
  ords."orderCanceled",
  buyer_stats."repeatBuyerRatio"
FROM
  (
    (
      (
        "User" u
        LEFT JOIN LATERAL (
          SELECT
            count(*) AS "reviewCount",
            count(*) FILTER (
              WHERE
                r.recommend
            ) AS "reviewPositive",
            count(*) FILTER (
              WHERE
                (NOT r.recommend)
            ) AS "reviewNegative"
          FROM
            (
              "Review" r
              JOIN "Service" s ON ((s.id = r."serviceId"))
            )
          WHERE
            (s."userId" = u.id)
        ) revs ON (TRUE)
      )
      LEFT JOIN LATERAL (
        SELECT
          count(*) FILTER (
            WHERE
              (
                o.status = ANY (
                  ARRAY ['IN_PROGRESS'::"OrderStatus", 'PENDING'::"OrderStatus"]
                )
              )
          ) AS "orderQueue",
          count(*) FILTER (
            WHERE
              (o.status = 'COMPLETED' :: "OrderStatus")
          ) AS "orderCompleted",
          count(*) FILTER (
            WHERE
              (o.status = 'CANCELED' :: "OrderStatus")
          ) AS "orderCanceled"
        FROM
          "Order" o
        WHERE
          (o."sellerId" = u.id)
      ) ords ON (TRUE)
    )
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(
          (
            (
              count(*) FILTER (
                WHERE
                  (per_buyer.cnt > 1)
              )
            ) :: numeric / (NULLIF(count(*), 0)) :: numeric
          ),
          (0) :: numeric
        ) AS "repeatBuyerRatio"
      FROM
        (
          SELECT
            o."buyerId",
            count(*) AS cnt
          FROM
            "Order" o
          WHERE
            (
              (o."sellerId" = u.id)
              AND (o.status = 'COMPLETED' :: "OrderStatus")
            )
          GROUP BY
            o."buyerId"
        ) per_buyer
    ) buyer_stats ON (TRUE)
  );