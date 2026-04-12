export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/api/employees/:path*', '/api/roles/:path*', '/api/settings/:path*', '/api/competencies/:path*'],
};
