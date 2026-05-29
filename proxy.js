import { NextResponse } from "next/server";

export function proxy(request) {
  const { nextUrl, cookies } = request;
  const isLoggedIn = cookies.get("isLoggedIn")?.value === "true";

  // Jika tidak punya cookie login aktif dan mencoba masuk ke area /home
  if (!isLoggedIn && nextUrl.pathname.startsWith("/home")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home/:path*"],
};
