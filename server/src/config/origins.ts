// Central cross-origin allowlist for CORS + Socket.IO.
//
// FRONTEND_URL may hold a comma-separated list so several origins (custom
// domain, www variant, preview URLs) can be allowed at once. When it is unset
// we fall back to the deployed frontend, and localhost is added outside
// production so `npm run dev` keeps working without any env changes.
const PRODUCTION_FRONTEND = 'https://textile-crm-frontend.onrender.com';

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const devOrigins =
  process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3001', 'http://127.0.0.1:3001'];

export const allowedOrigins: string[] = Array.from(
  new Set([...(envOrigins.length > 0 ? envOrigins : [PRODUCTION_FRONTEND]), ...devOrigins])
);

// Express `cors` callback: echo the origin when allowed, otherwise omit the
// header (the browser then blocks it) instead of throwing a 500.
export const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void => {
  // Requests without an Origin header (same-origin, curl, server-to-server)
  // are always allowed.
  callback(null, !origin || allowedOrigins.includes(origin));
};
