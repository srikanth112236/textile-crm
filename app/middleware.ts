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
    const prefixPublicRoutes = ['/products', '/search', '/categories', '/templates', '/demo', '/demo-'];

    const isExpressCheckout = path === '/checkout/express' || path.startsWith('/checkout/express/');
    const isPublicRoute =
      !isExpressCheckout &&
      (exactPublicRoutes.has(path) ||
        path.startsWith('/demo-') ||
        prefixPublicRoutes.some((route) => path.startsWith(`${route}/`)));

    // Allow access to public routes without a token.
    // Auth pages stay reachable for signed-in users too; the page itself
    // shows a "Continue shopping / Go to dashboard" choice. We never hijack
    // a visitor into a dashboard just because they are authenticated.
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // For protected routes, require authentication.
    if (!token) {
      // Product rule: never force /login. Land on the storefront with a
      // gentle login prompt (AuthPromptListener opens the modal on `/`).
      // Keep the query string so filters/checkout intent survive login.
      const homeUrl = new URL('/', req.url);
      homeUrl.searchParams.set('authRequired', '1');
      homeUrl.searchParams.set('callbackUrl', `${path}${req.nextUrl.search || ''}`);
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
