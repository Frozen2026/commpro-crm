import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // commpro.ai root domain always shows marketing site
  if (hostname === 'commpro.ai' || hostname === 'www.commpro.ai') {
    if (pathname === '/') {
      return NextResponse.next()
    }
  }

  // app.commpro.ai redirects to login
  if (hostname === 'app.commpro.ai' && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
