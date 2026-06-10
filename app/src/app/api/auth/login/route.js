import {
  createAdminSession,
  createSessionCookie,
  verifyAdminCredentials,
} from '@/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const verified = await verifyAdminCredentials(email, password);

    if (!verified.ok) {
      const message = verified.reason === 'missing-config'
        ? 'Admin credentials chua duoc cau hinh tren server.'
        : 'Sai tai khoan hoac mat khau.';
      return Response.json({ success: false, error: message }, { status: 401 });
    }

    const session = await createAdminSession({
      email,
      displayName: String(email || '').split('@')[0] || 'Admin',
    });

    return Response.json(
      { success: true, user: session.user },
      {
        headers: {
          'Set-Cookie': createSessionCookie(session.token, session.maxAge),
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('auth.login:', error);
    return Response.json(
      { success: false, error: error?.message || 'Khong the dang nhap.' },
      { status: 500 }
    );
  }
}
