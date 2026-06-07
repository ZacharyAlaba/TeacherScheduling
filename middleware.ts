import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { authSecret } from "@/lib/authSecret";
import { refreshSupabaseSession } from "@/utils/supabase/middleware";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, cookie);
  });
}

export default async function middleware(req: NextRequest) {
  const supabaseResponse = await refreshSupabaseSession(req);
  const token = await getToken({ req, secret: authSecret });
  const path = req.nextUrl.pathname;

  const redirectWithCookies = (destination: string) => {
    const response = NextResponse.redirect(new URL(destination, req.url));
    copyCookies(supabaseResponse, response);
    return response;
  };

  if (path.startsWith("/admin") && token?.role !== "ADMIN") {
    return redirectWithCookies("/teacher");
  }

  if (path.startsWith("/teacher") && token?.role !== "TEACHER") {
    return redirectWithCookies("/admin");
  }

  if (path.startsWith("/student") && token?.role !== "STUDENT") {
    return redirectWithCookies("/login");
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
