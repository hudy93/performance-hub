import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isMaintenanceMode) {
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname === '/'
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Normal auth middleware
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
