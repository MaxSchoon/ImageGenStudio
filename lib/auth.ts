const AUTH_SALT = 'imagegen-studio-auth';

export const AUTH_COOKIE_NAME = 'auth-token';
export const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function generateAuthToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + AUTH_SALT);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
