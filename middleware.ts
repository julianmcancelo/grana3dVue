import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_EMAILS = ['jcancelo.dev@gmail.com'];

const PUBLIC_API_ROUTES = [
  '/api/webhook',
  '/api/checkout',
  '/api/coupons/validate',
  '/api/products',
  '/api/chat',
  '/api/assistant',
  '/api/orders',
  '/api/orders/tracking',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  if (pathname.startsWith('/api/')) {
    const isPublic = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));

    if (!isPublic) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
