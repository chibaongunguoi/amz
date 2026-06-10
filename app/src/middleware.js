import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from './server/auth/session';

const PROTECTED_API_PREFIXES = [
  '/api/admin',
  '/api/save-collection',
  '/api/upload-image',
  '/api/upload-image-file',
];

function isProtectedApi(request) {
  const { pathname } = request.nextUrl;
  if (PROTECTED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  if (pathname.startsWith('/api/collections/')) {
    return !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  }

  return false;
}

function unauthorizedApi() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const needsAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const needsApiAuth = isProtectedApi(request);

  if (!needsAdmin && !needsApiAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifyAdminSession(token);
  if (user) {
    return NextResponse.next();
  }

  if (needsApiAuth) {
    return unauthorizedApi();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search || ''}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/save-collection',
    '/api/upload-image',
    '/api/upload-image-file',
    '/api/collections/:path*',
  ],
};
