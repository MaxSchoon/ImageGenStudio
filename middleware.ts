import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API through
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || !token) {
    return redirect(request, pathname);
  }

  const expectedToken = await generateAuthToken(sitePassword);

  if (token !== expectedToken) {
    return redirect(request, pathname);
  }

  return NextResponse.next();
}

function redirect(request: NextRequest, pathname: string) {
  // Return 401 for API routes instead of redirecting
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|icons|images|manifest\\.json|favicon\\.ico).*)',
  ],
};
