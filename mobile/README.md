# Mentoos mobile

Expo **SDK 58** (React Native 0.88.1, React 19.3, expo-router 58) storefront on
**the same Express backend as the web app** (`server/`, mounted at `/api`).
Shares the design tokens from `app/app/globals.css` and the shadcn component model
(React Native Reusables).

> Upgraded from SDK 56 → 58. Native module versions come from
> `expo/bundledNativeModules.json`; `npx expo-doctor` reports **20/20 checks passed**.
> The custom `app/+html.tsx` document was removed — on SDK 58 it suppressed the
> client bundle script in static exports (blank page). The default document already
> includes `ScrollViewStyleReset`.

## Run

```bash
npm install

npm run dev        # phone / emulator (Expo Go): scan the QR
npm run web        # browser preview — starts the CORS proxy + Expo web together
npm run proxy      # just the proxy, if you prefer two terminals
npm run typecheck
```

### API target

`mobile/.env` holds `EXPO_PUBLIC_API_URL` (native builds).

| Target | Value |
| --- | --- |
| Production backend | `https://textile-crm-backend.onrender.com` (default) |
| Local `server/` on a phone | `http://<your-LAN-IP>:5000` |
| Local on iOS sim | `http://localhost:5000` |
| Local on Android emulator | `http://10.0.2.2:5000` |

**Browser previews need the proxy.** The deployed API only allow-lists the deployed
web storefront, so a browser on `http://localhost:8081` gets no
`Access-Control-Allow-Origin` header and every request fails (which showed up as
"You're offline"). `npm run web` starts `scripts/cors-proxy.js` on port 5050 and
points the web build at it; native builds never need it because React Native sends
no `Origin` header.

The proxy decodes gzip/brotli itself and sets `cache-control: no-store`, so the
browser always receives plain JSON — no stale or mis-decoded bodies.

If you ever see the error screen, it prints the resolved API base under the message
(dev builds only) so you can tell at a glance whether it pointed at the proxy, a
local server, or production.

## Tests

Playwright drives the **production web export** (port 8090) against the live API,
so runs are deterministic and free of Metro's dev overlay.

```bash
npm run test:e2e          # builds the export, serves it, runs every spec
npm run test:e2e:report   # HTML report (test-results/html)
```

- `e2e/storefront.spec.ts` — home rails, category tree, category page, content pages
- `e2e/catalog.spec.ts` — 150-product listing, filter sheet + chips, sort, search, PDP → add to bag → bag
- `e2e/screenshots.spec.ts` — device-sized PNGs into `e2e/screenshots/` (also copied to
  `reports/device-shots/mobile/`). Runs against the **production web export** on :8090
  (`npm run build:web && npm run serve:web`) so Metro's dev overlay never appears.

Every spec asserts no "can't reach the store" state, real ₹ prices from the API, and a
clean browser console. Config lives in `playwright.config.ts` (Chromium, 390×844, IN locale).

Last run: **8 passed**.

## What talks to the backend

| Mobile screen | Endpoints |
| --- | --- |
| Home `(tabs)/index` | `/products` (new, best-selling), `/products/recommendations/trending`, `/categories`, `/shop-look`, `/products/reviews/featured`, `/settings` |
| Shop `(tabs)/shop` | `/categories?status=active`, `/products` (count) |
| Search `(tabs)/search` | `/products/search?q=`, `/categories` |
| Listing `products/index` | `/products` (filters, sort, infinite scroll), `/products/filters` |
| PDP `product/[id]` | `/products/:id`, `/products/:id/recommendations`, `/products/:id/reviews`, `/wishlist/:id` |
| Bag `(tabs)/cart` | `/cart` (+ guest basket in AsyncStorage, merged on sign-in) |
| Checkout `checkout/index` | `/profile/addresses`, `/shipment/quote`, `/settings/cod-quote`, `/discounts/validate`, `/orders` |
| Orders `orders/*` | `/orders`, `/orders/:id`, `/orders/:id/cancel`, `/shipment/track-order/:number` |
| Account `(tabs)/account` | `/profile`, `/loyalty/balance`, `/orders` (count), `/referrals/mine` |
| Auth `auth/index` | `/auth/login`, `/auth/register`, `/auth/otp/send`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout` |
| Wishlist / loyalty / referrals | `/wishlist`, `/loyalty/*`, `/referrals/mine` |

## Architecture

```
lib/
  config.ts          API base + image URL resolution (/uploads → absolute)
  api/client.ts      fetch wrapper: bearer auth, single-flight refresh, 401 retry, ApiError
  api/types.ts       backend contracts (Product, Cart, Order, Address, …)
  api/endpoints.ts   one function per endpoint group
  auth.tsx           session (SecureStore tokens, profile bootstrap, sign in/up/OTP)
  cart.tsx           guest cart (AsyncStorage) + server cart, merged on sign-in
  query.tsx          TanStack Query client + query keys
  format.ts          INR formatting, mirrors app/lib/utils.ts
  theme.ts           navigation theme, mirrors global.css
  storage.ts         AsyncStorage + SecureStore abstraction (web falls back to AsyncStorage)
app/                file-based routes (Expo Router)
components/         tokens-driven UI: product card, rails, sheets, skeletons, states
```

## Backend change required for mobile sessions

`POST /auth/login`, `/auth/register` and `/auth/otp/verify` now also return `refreshToken`
in the JSON body (`server/src/controllers/authController.ts`, `otpController.ts`).
React Native has no cookie jar, so this is what lets the app refresh a 15-minute access
token instead of forcing a re-login. The HttpOnly cookie path for the web app is untouched.

## Brand, icon and splash

The mark comes from the web storefront (`app/app/icon.svg`): amber `M` on a
slate-950 tile, wordmark `MENTOOS.` with an amber period.

```bash
node scripts/generate-brand-assets.js   # regenerates every icon from the SVG
```

| Asset | Used by |
| --- | --- |
| `assets/images/icon.png` | iOS/Android app icon |
| `assets/images/adaptive-icon.png` | Android adaptive icon (navy background) |
| `assets/images/splash-icon.png` | native splash (`#0f172a`, contain, 180px) |
| `assets/images/favicon.png` | web favicon |
| `components/brand-mark.tsx` | in-app logo (SVG, crisp at any size) |
| `components/brand-splash.tsx` | animated launch screen: logo + wordmark + tagline, fades into the app once the session restores (min 850 ms) |

`expo-splash-screen` keeps the native splash up until React mounts, then
`BrandSplash` takes over with the same navy background — no white flash.

## Pages (mobile ⇄ web)

Every public storefront page and every customer-portal page has a native screen.

| Web route | Mobile route | Status |
| --- | --- | --- |
| Home | hero carousel (3 storefront slides), announcement, category tiles, new/trending/best-sellers rails, shop-the-look, reviews, trust row |
| `/categories/[slug]` | `categories/[slug]` | cover, description, sub-collections, product grid + load more |
| `/products` | `products/index` | sort, filters (size/colour/price/rating/stock), infinite scroll |
| `/products/[id]` | `product/[id]` | gallery, variants + per-SKU stock, reviews, size guide, specs, recommendations |
| `/search` | `(tabs)/search` | live suggestions (matching products + categories), trending searches, recent, "see all results" |
| `/cart` | `(tabs)/cart` | guest + signed-in bag, free-shipping progress, savings |
| `/checkout` | `checkout/index` | addresses, shipping quote, COD + advance, coupon |
| `/track-order` | `track-order` | public shipment lookup by order number |
| `/about` `/contact` `/faq` `/shipping` `/returns` `/terms` `/privacy` `/cookies` `/support` | `content/[slug]` | real store copy |
| `/user/dashboard` | `(tabs)/account` | identity, rewards progress, quick tiles, grouped portal rows |
| `/user/orders` `/user/orders/[id]` | `orders/index`, `orders/[id]` | status filters, timeline, cancel, return/exchange sheet |
| `/user/returns` | `returns/index` | RMA list + eligible delivered orders |
| `/user/invoices` `/user/orders/[id]/invoice` | `invoices/index`, `invoices/[orderId]` | GST invoice, PDF via expo-print + sharing |
| `/user/payments` | `payments` | paid/due totals, method filter |
| `/user/refunds` | `refunds` | RMA refunds + cancelled/refunded orders |
| `/user/wishlist` | `wishlist` | saved products |
| `/user/loyalty` | `loyalty` | balance, tier progress, activity |
| `/user/referral` | `referrals` | code, share sheet, stats |
| `/user/profile` | `account/profile` | name/phone |
| `/user/settings` | `settings` | GDPR export, delete account, appearance |
| addresses | `account/addresses` | list/add/edit/delete |
| `(auth)/login` `(auth)/register` | `auth/index` | email sign-in, sign-up, phone OTP |

Not ported: `checkout/express` (needs the Razorpay native SDK), `register-admin` (staff).

## Test account (seeded during verification)

```
email:    app.qa.mobile@mentoos.com
password: Mentoos@2026
```

It has one **cancelled** test order (`ORD-20261118-001`) so the orders / payments /
refunds / invoice screens have data. Delete the account from Account → Account
settings → Delete account when you no longer need it.

## Conventions

- Token classes only (`bg-background`, `text-muted-foreground`, `border-border`, `bg-sale`,
  `text-success`). No raw hex in screens.
- Type scale: `text-display` / `text-h1` / `text-h2` / `text-body` / `text-label` / `text-caption`.
- Every network screen has loading (skeleton), empty, error + retry, and populated states.
- Add components with `npx @react-native-reusables/cli@latest add <name>`, then own the file.

## Known gaps / next steps

1. **Online payments** need `react-native-razorpay` (custom dev build, not Expo Go). COD works today and the online option is shown disabled.
2. Guest checkout (`POST /orders/guest`) is not wired — the bag works as a guest, checkout asks for sign-in.
3. Review submission (`POST /products/:id/reviews`) and stock alerts are not wired yet.
4. Product video, UGC reels and Instagram feed sections are not ported.
5. Deploy the server so login/register/OTP return `refreshToken` — until then sessions last the 15-minute access-token window instead of 7 days.
