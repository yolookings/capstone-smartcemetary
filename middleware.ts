import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("Middleware auth error (redirecting to login):", err);
  }

  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')
  const isUserDashboard = pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/admin')
  const isAdminRoute = pathname.startsWith('/dashboard/admin')

  if (!user && (isUserDashboard || isAdminRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && isAdminRoute) {
    let userRole = 'ADMIN'; // Default to ADMIN to prevent false-positive lockouts on Edge DB/network failures
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id);
      
      if (!error && profiles && profiles.length > 0) {
        userRole = profiles[0].role || 'USER';
      } else {
        // If query is empty (RLS) or errored, fallback to metadata but default to ADMIN to let the layout verify
        userRole = user.user_metadata?.role || 'ADMIN';
      }
    } catch (err) {
      console.error("Middleware profile role fetch failed, letting layout verify:", err);
      userRole = 'ADMIN';
    }

    if (userRole !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}