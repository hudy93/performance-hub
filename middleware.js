import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

const PUBLIC_ROUTES = [
  '/api/auth',     // NextAuth OAuth flow
  '/impressum',    // Legal (TMG §5)
  '/datenschutz',  // Legal (GDPR)
];

function isPublicRoute(pathname) {
  // Root page is public (landing / sign-in page)
  if (pathname === '/') return true;
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://avatars.githubusercontent.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

function applySecurityHeaders(response) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Maintenance mode
  if (isMaintenanceMode) {
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname === '/'
    ) {
      return applySecurityHeaders(NextResponse.next());
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  // Public routes — skip auth, still get headers
  if (isPublicRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Auth check for private routes
  const isSecure = request.nextUrl.protocol === 'https:';
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
    secureCookie: isSecure,
  });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
