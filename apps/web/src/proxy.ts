import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge auth guard (Next 16 `proxy`, the former `middleware`). Performs a cheap
 * cookie-presence check only (no network/DB call): the Better Auth session
 * cookie is host-scoped, so it is readable here when web and api share a host
 * (local dev, or a shared production domain). Full session validation still
 * happens in the API on every data request.
 *
 * Logged-out users are kept out of the dashboard; logged-in users are kept out
 * of the auth pages. The marketing landing (`/`) is always public.
 */
const AUTH_PATHS = ["/sign-in", "/sign-up"];
const DASHBOARD_PREFIX = "/dashboard";

export function proxy(request: NextRequest): NextResponse {
  const hasSession = Boolean(getSessionCookie(request));
  const { pathname } = request.nextUrl;

  const onAuthPage = AUTH_PATHS.includes(pathname);
  const onDashboard = pathname.startsWith(DASHBOARD_PREFIX);

  if (onDashboard && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (onAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
