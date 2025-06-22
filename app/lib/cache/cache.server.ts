import { singleton } from "~/singleton.server";
import { createClient } from "redis";

const client = singleton("cache", () =>
  createClient({ url: process.env.REDIS_URL })
);

client.connect();

export { client };
