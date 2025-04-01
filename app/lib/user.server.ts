import { createCookie, redirect } from "@remix-run/node";

export type UserPrefs = {
  role: "seller" | "buyer";
};

export const userPrefsCookie = createCookie("user-prefs", {
  path: "/",
  httpOnly: true, // helps prevent XSS
  secure: process.env.NODE_ENV === "production", // only over HTTPS in production
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // one week
});

export function getCookie(request: Request) {
  const cookie = request.headers.get("Cookie");
  return cookie;
}

export async function getUserPrefs(
  request: Request
): Promise<UserPrefs | null> {
  const cookie = getCookie(request);
  if (!cookie) return null;
  return userPrefsCookie.parse(cookie);
}

export async function createUserCookie({
  request,
  redirectTo = "/",
  role,
}: {
  request: Request;
  redirectTo?: string;
  role: "seller" | "buyer";
}) {
  const cookieValue: UserPrefs = { role };
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await userPrefsCookie.serialize(cookieValue),
    },
  });
}
