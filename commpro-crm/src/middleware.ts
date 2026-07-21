import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/signup', '/coi-request']
const marketingHosts = new Set(['commpro.ai', 'www.commpro.ai'])
const appHost = 'app.commpro.ai'

function getHost(request: NextRequest) {
  const urlHost = request.nextUrl.hostname?.toLowerCase()
  if (urlHost) {
    return urlHost
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const hostHeader = forwardedHost || request.headers.get('host') || ''
  const normalizedHost = hostHeader.split(',')[0]?.trim() || ''
  return normalizedHost.split(':')[0].toLowerCase()
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = getHost(request)

  // Marketing domains always show homepage at root and avoid login route.
  if (marketingHosts.has(hostname)) {
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname === '/') {
      return NextResponse.next()
    }

    if (pathname === '/login' || pathname === '/login/') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // App subdomain root redirects to login.
  if (hostname === appHost && pathname === '/') {
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
