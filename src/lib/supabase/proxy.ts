import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/cards/")) return true;
  return false;
}

function isAuthPath(pathname: string) {
  return pathname === "/login" || pathname === "/signup";
}

function copySessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  for (const header of ["cache-control", "expires", "pragma"] as const) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

/** Refresh the auth session and enforce protected / public route rules. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;

  // API routes keep returning JSON 401 via requireUser — do not HTML-redirect them.
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  if (!signedIn && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(url);
    return copySessionCookies(supabaseResponse, redirect);
  }

  if (signedIn && isAuthPath(pathname)) {
    const rawNext = request.nextUrl.searchParams.get("next");
    const dest =
      rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
    const redirect = NextResponse.redirect(new URL(dest, request.url));
    return copySessionCookies(supabaseResponse, redirect);
  }

  return supabaseResponse;
}
