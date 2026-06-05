import { type EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/reset-password'

  // Build redirect URL upfront
  const redirectTo = `${origin}${next}`
  // Use a mutable response so we can attach session cookies
  let response = NextResponse.redirect(redirectTo)

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
          // Recreate response so the updated cookies are included in the redirect
          response = NextResponse.redirect(redirectTo)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ── Flow 1: token_hash + type (password reset / magic link via email template) ──
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return response
    }
    console.error('Auth callback verifyOtp error:', error.message)
  }

  // ── Flow 2: code (PKCE OAuth / password reset PKCE flow) ──
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    console.error('Auth callback exchangeCodeForSession error:', error.message)
  }

  // ── Error: redirect to intended page with error info ──
  const errorUrl = new URL(redirectTo)
  errorUrl.searchParams.set('error', 'invalid_or_expired')
  errorUrl.searchParams.set(
    'error_description',
    'Link tidak valid atau sudah kedaluwarsa. Silakan minta link baru.'
  )
  return NextResponse.redirect(errorUrl.toString())
}
