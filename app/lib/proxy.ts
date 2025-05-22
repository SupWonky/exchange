import http from "node:http";
import { proxies } from "~/constants";
import { singleton } from "~/singleton.server";

const RETRY = 100;

// 1. async getProxyList that waits for every check
async function getProxyList(): Promise<string[]> {
  const checks = await Promise.all(
    proxies.map(async (proxyUrl) => {
      try {
        const ok = await checkAnonymity(proxyUrl);
        return ok ? proxyUrl : null;
      } catch {
        return null;
      }
    })
  );
  return checks.filter((p): p is string => !!p);
}

// 2. cache it via your singleton (which now returns a Promise<string[]>)
const VALID_PROXIES_P = singleton("proxies", getProxyList);

async function checkAnonymity(proxyUrl: string, timeout = 3000) {
  const [host, port] = proxyUrl.split(":");
  const options: http.RequestOptions = {
    host,
    port: Number(port),
    path: "https://www.google.com/",    // absolute URL for HTTP proxy
    method: "GET",
    headers: { Host: "www.google.com" }, // ensure Host header is set
  };

  return new Promise<boolean>((resolve, reject) => {
    const req = http.request(options, (res) => {
      const leaked =
        res.headers["x-forwarded-for"] || res.headers.via;
      resolve(!leaked);
    });

    req.setTimeout(timeout, () =>
      req.destroy(new Error("Proxy timed out"))
    );
    req.on("error", (err) => reject(err));
    req.end();
  });
}

export async function getProxy(): Promise<string | undefined> {
  const VALID_PROXIES = await VALID_PROXIES_P;
  let attempt = 0;
  let idx = Math.floor(Math.random() * VALID_PROXIES.length);

  while (attempt++ < RETRY) {
    const candidate = VALID_PROXIES[idx];
    try {
      if (await checkAnonymity(candidate)) {
        return candidate;
      }
    } catch {
      /* ignore and try next */
    }
    idx = (idx + 1) % VALID_PROXIES.length;
  }
  return undefined;
}
