import { createHmac } from "crypto";

export function generateSign(body: object) {
  const signature = createHmac("sha256", process.env.LAVA_API_KEY!)
    .update(JSON.stringify(body))
    .digest("hex");

  return signature;
}
