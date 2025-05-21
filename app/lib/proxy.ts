import http from "node:http";
import { proxies } from "~/constants";
import { singleton } from "~/singleton.server";

const RETRY = 100;
const VALID_PROXIES = singleton("proxies", getProxyList);

console.log(VALID_PROXIES);

async function checkAnonymity(proxyUrl: string, timeout = 3000) {
  const [host, port] = proxyUrl.split(":");
  const options = { host, port, path: "https://www.google.com" };

  return new Promise((resolve, reject) => {
    const req = http.get(options, (res) => {
      // console.log("get");
      // let data = "";
      // res.on("data", (chunk) => (data += chunk));
      // res.on("end", () => {
      //   const headers = JSON.parse(data).headers;
      //   const leaked = headers["X-Forwarded-For"] || headers.Via;
      //   resolve(!leaked);
      // });

      const headers = res.headers;
      const leaked = headers["X-Forwarded-For"] || headers.Via;
      resolve(!leaked);
    });

    req.setTimeout(timeout, () => {
      req.destroy(new Error("Request timed out"));
    });

    req.on("error", (err) => reject(err));
  });
}

export async function getProxy(): Promise<string | undefined> {
  console.log(VALID_PROXIES.length);
  let proxy = undefined;
  let idx = Math.floor(Math.random() * VALID_PROXIES.length);
  let attempt = 0;

  while (proxy === undefined && attempt < RETRY) {
    try {
      const result = await checkAnonymity(VALID_PROXIES[idx]);
      if (result) {
        proxy = VALID_PROXIES[idx];
        break;
      }
    } catch (e) {
      console.log("Proxy error: " + e);
    }

    idx = (idx + 1) % VALID_PROXIES.length;
    attempt++;
  }

  return proxy;
}

export function getProxyList(): string[] {
  const proxyList: string[] = [];

  for (const proxy of proxies) {
    checkAnonymity(proxy)
      .then((result) => {
        if (result) {
          proxyList.push(proxy);
        }
      })
      .catch(() => {});
  }

  return proxyList;
}
