import { createExpiredSessionCookie } from '@/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return Response.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': createExpiredSessionCookie(),
        'Cache-Control': 'no-store',
      },
    }
  );
}
