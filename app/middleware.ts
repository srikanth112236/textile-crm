import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: { token: any } }) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    // Public routes that don't require authentication.
    // Browsing, guest cart/checkout and guest order tracking are public.
    // `/checkout/express` is intentionally NOT public — it is customer-only.
    const exactPublicRoutes = new Set([
      '/',
      '/login',
      '/register',
      '/register-admin',
      '/products',
      '/search',
      '/categories',
      '/track-order',
      '/cart',
      '/checkout',
      // Informational / legal pages linked from the footer.
      '/about',
      '/contact',
      '/shipping',
      '/returns',
      '/faq',
      '/support',
      '/privacy',
      '/terms',
      '/cookies',
    ]);
    const prefixPublicRoutes = ['/products', '/search', '/categories'];

    const isExpressCheckout = path === '/checkout/express' || path.startsWith('/checkout/express/');
    const isPublicRoute =
      !isExpressCheckout &&
      (exactPublicRoutes.has(path) || prefixPublicRoutes.some((route) => path.startsWith(`${route}/`)));

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
      // Product rule: never force /login. Land on the storefront with a
      // gentle login prompt (AuthPromptListener opens the modal on `/`).
      const homeUrl = new URL('/', req.url);
      homeUrl.searchParams.set('authRequired', '1');
      homeUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(homeUrl);
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
      // The middleware body above already decides access (and redirects
      // protected pages to `/?authRequired=1`). Always return true here so
      // next-auth never bounces users to its default signIn page.
      authorized: () => true,
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
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|woff|woff2)$).*)',
  ],
};
