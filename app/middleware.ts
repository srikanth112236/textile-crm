import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: { token: any } }) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    // Public routes that don't require authentication
    // Browsing + pincode check + guest order tracking are public.
    // Cart / checkout / wishlist / orders / any shopping action requires login.
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/register-admin',
      '/products',
      '/search',
      '/categories',
      '/track-order',
    ];

    // Check if the path is a public route or starts with a public route prefix
    const isPublicRoute = publicRoutes.some(route => 
      path === route || path.startsWith(`${route}/`)
    );

    // Allow access to public routes without token
    if (isPublicRoute) {
      // For auth pages, if user is already authenticated, redirect to their dashboard
      if (token && (path === '/login' || path === '/register' || path === '/register-admin')) {
        const userRole = (token as any)?.role;
        if (userRole === 'superadmin') {
          return NextResponse.redirect(new URL('/superadmin/dashboard', req.url));
        } else if (userRole === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        } else if (userRole === 'user') {
          return NextResponse.redirect(new URL('/user/dashboard', req.url));
        }
      }
      // Allow access to all public routes (including root path)
      return NextResponse.next();
    }

    // For protected routes, require authentication
    if (!token) {
      // Redirect to login, but preserve the original URL as callback
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (token as any)?.role;

    // Protect role-based routes
    if (path.startsWith('/superadmin') && userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/user/dashboard', req.url));
    }

    if (path.startsWith('/admin') && !['superadmin', 'admin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/user/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
      callbacks: {
      // Only require auth for protected routes (not public routes)
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/register-admin',
          '/products',
          '/search',
          '/categories',
          '/track-order',
        ];

        // Check if the path is a public route or starts with a public route prefix
        const isPublicRoute = publicRoutes.some(route => 
          path === route || path.startsWith(`${route}/`)
        );

        // Allow access to public routes without token
        if (isPublicRoute) {
          return true; // Allow access
        }
        
        // Require token for all other routes (protected routes)
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
