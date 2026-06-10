import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifyAdminSession(token);

  if (!user) {
    return Response.json(
      { authenticated: false, user: null },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return Response.json(
    { authenticated: true, user },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
