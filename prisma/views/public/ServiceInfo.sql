SELECT
  s.id,
  s.id AS "serviceId",
  s.title,
  s.description,
  s."requiredInfo",
  (
    SELECT
      count(*) AS count
    FROM
      "Review" r
    WHERE
      (r."serviceId" = s.id)
  ) AS "reviewCount"
FROM
  "Service" s;