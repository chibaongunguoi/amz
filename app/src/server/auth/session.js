export const ADMIN_SESSION_COOKIE = 'amz_admin_session';

const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;
const DEV_ADMIN_EMAIL = 'admin@amztech.vn';
const DEV_ADMIN_PASSWORD = '123456';
const DEV_SESSION_SECRET = 'amztech-dev-session-secret-change-before-release';

function textEncoder() {
  return new TextEncoder();
}

function encodeBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  const padded = String(value).replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(String(value).length / 4) * 4,
    '='
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeJson(data) {
  return encodeBase64Url(textEncoder().encode(JSON.stringify(data)));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function getRuntimeSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === 'production' ? '' : DEV_SESSION_SECRET)
  );
}

function getSessionTtlSeconds() {
  const configured = Number(process.env.ADMIN_SESSION_TTL_SECONDS);
  return Number.isFinite(configured) && configured > 0
    ? Math.trunc(configured)
    : DEFAULT_SESSION_TTL_SECONDS;
}

async function hmacSha256(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder().encode(message));
  return encodeBase64Url(new Uint8Array(signature));
}

function secureCompare(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export function getAdminCredentialConfig() {
  const email = process.env.ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? '' : DEV_ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : DEV_ADMIN_PASSWORD);
  const passwordSha256 = process.env.ADMIN_PASSWORD_SHA256 || '';
  return {
    email,
    password,
    passwordSha256,
    configured: Boolean(email && (password || passwordSha256)),
  };
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder().encode(String(value || '')));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminCredentials(email, password) {
  const config = getAdminCredentialConfig();
  if (!config.configured) {
    return { ok: false, reason: 'missing-config' };
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const expectedEmail = String(config.email || '').trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail !== expectedEmail) {
    return { ok: false, reason: 'invalid' };
  }

  if (config.passwordSha256) {
    const incomingHash = await sha256Hex(password);
    return secureCompare(incomingHash, config.passwordSha256)
      ? { ok: true }
      : { ok: false, reason: 'invalid' };
  }

  return secureCompare(String(password || ''), String(config.password || ''))
    ? { ok: true }
    : { ok: false, reason: 'invalid' };
}

export async function createAdminSession(user) {
  const secret = getRuntimeSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.');

  const now = Math.floor(Date.now() / 1000);
  const ttl = getSessionTtlSeconds();
  const payload = {
    sub: 'admin',
    email: String(user?.email || '').trim().toLowerCase(),
    displayName: user?.displayName || 'Admin',
    iat: now,
    exp: now + ttl,
  };
  const encodedPayload = encodeJson(payload);
  const signature = await hmacSha256(encodedPayload, secret);
  return {
    token: `${encodedPayload}.${signature}`,
    maxAge: ttl,
    user: {
      email: payload.email,
      displayName: payload.displayName,
    },
  };
}

export async function verifyAdminSession(token) {
  try {
    const secret = getRuntimeSecret();
    if (!secret || !token || typeof token !== 'string') return null;

    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = await hmacSha256(encodedPayload, secret);
    if (!secureCompare(signature, expectedSignature)) return null;

    const payload = decodeJson(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.email || !payload?.exp || payload.exp <= now) return null;

    return {
      email: payload.email,
      displayName: payload.displayName || 'Admin',
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}

function shouldUseSecureCookie() {
  if (process.env.ADMIN_COOKIE_SECURE) {
    return process.env.ADMIN_COOKIE_SECURE !== 'false';
  }
  return String(process.env.NEXT_PUBLIC_SITE_URL || '').startsWith('https://');
}

export function createSessionCookie(token, maxAge) {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (shouldUseSecureCookie()) parts.push('Secure');
  return parts.join('; ');
}

export function createExpiredSessionCookie() {
  return [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ].join('; ');
}
