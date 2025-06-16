import net from "net";
import { proxies } from "~/constants";
import { singleton } from "~/singleton.server";

const RETRY = 100;

async function checkProxy(proxyUrl: string, timeout = 5000): Promise<boolean> {
  const testUrl = "http://httpbin.org/ip";
  const target = new URL(testUrl);
  const proxy = new URL(`http://${proxyUrl}`); // Supports HTTP proxies

  return new Promise((resolve) => {
    const socket = net.connect({
      host: proxy.hostname,
      port: Number(proxy.port) || 80,
      timeout,
    });

    let connected = false;
    let responseData = "";

    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);

    socket.on("connect", () => {
      // Send CONNECT request for HTTPS tunneling (even for HTTP targets)
      socket.write(
        `CONNECT ${target.hostname}:${target.port || 80} HTTP/1.1\r\n`
      );
      socket.write(`Host: ${target.hostname}:${target.port || 80}\r\n`);
      socket.write("\r\n");
    });

    socket.on("data", (data) => {
      const response = data.toString();

      if (!connected) {
        // Check CONNECT response
        if (!response.startsWith("HTTP/1.1 200")) {
          clearTimeout(timer);
          socket.destroy();
          resolve(false);
        }
        connected = true;

        // Now send actual HTTP request through the tunnel
        const request = [
          `GET ${testUrl} HTTP/1.1`,
          `Host: ${target.hostname}`,
          "Connection: close",
          "\r\n",
        ].join("\r\n");

        return socket.write(request);
      }

      responseData += response;
    });

    socket.on("end", () => {
      clearTimeout(timer);
      try {
        const headersEnd = responseData.indexOf("\r\n\r\n");
        const body = responseData.slice(headersEnd + 4);
        const { origin } = JSON.parse(body);

        // Verify if the response IP matches proxy IP
        // You should compare against known proxy IP here
        resolve(!!origin && !responseData.includes("X-Forwarded-For"));
      } catch {
        resolve(false);
      }
    });

    socket.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function getProxyList(): Promise<string[]> {
  const checks = await Promise.all(
    proxies.map(async (proxyUrl) => {
      try {
        const ok = await checkProxy(proxyUrl);
        return ok ? proxyUrl : null;
      } catch {
        return null;
      }
    })
  );
  return checks.filter((p): p is string => !!p);
}

const VALID_PROXIES_P = singleton("proxies", getProxyList);

// async function checkAnonymity(proxyUrl: string, timeout = 3000) {
//   const [host, port] = proxyUrl.split(":");
//   const options: http.RequestOptions = {
//     host,
//     port: Number(port),
//     path: "https://www.google.com/", // absolute URL for HTTP proxy
//     method: "GET",
//     headers: { Host: "www.google.com" }, // ensure Host header is set
//   };

//   return new Promise<boolean>((resolve, reject) => {
//     const req = http.request(options, (res) => {
//       const leaked = res.headers["x-forwarded-for"] || res.headers.via;
//       const status = (res.statusCode || 400) < 400;
//       resolve(!leaked && status);
//     });

//     req.setTimeout(timeout, () => req.destroy(new Error("Proxy timed out")));
//     req.on("error", (err) => reject(err));
//     req.end();
//   });
// }

export async function getProxy(): Promise<string | undefined> {
  const VALID_PROXIES = await VALID_PROXIES_P;
  console.log(VALID_PROXIES);
  let attempt = 0;
  let idx = Math.floor(Math.random() * VALID_PROXIES.length);

  while (attempt++ < RETRY) {
    const candidate = VALID_PROXIES[idx];
    try {
      if (await checkProxy(candidate)) {
        return candidate;
      }
    } catch {
      /* ignore and try next */
    }
    idx = (idx + 1) % VALID_PROXIES.length;
  }
  return undefined;
}
