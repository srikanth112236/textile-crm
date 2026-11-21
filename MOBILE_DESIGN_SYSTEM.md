# Mobile Design System — Mobbin references + shadcn-style React Native UI

Goal: ship an Expo/React Native app for this storefront that looks like the same
product as `app/` (Next.js + shadcn/ui, slate base color, `--radius: 0.5rem`),
using Mobbin as the research source instead of guessing.

Status: `mobile/` is wired to the **same Express backend as the web storefront**
(`server/`, `/api`). Home, categories, listing + filters, search, PDP with variants
and reviews, cart (guest + signed-in), checkout, orders, wishlist, addresses,
loyalty, referrals, order tracking and the auth flow all read real data.
See `mobile/README.md` for the endpoint map.

---

## 1. What is connected right now

| Server | How | Status |
| --- | --- | --- |
| `shadcn` (MCP, local) | `npx shadcn@latest mcp`, wired into `~/.config/opencode/opencode.jsonc` under `mcp.servers.shadcn` | ✅ connected — can search registries and generate `add` commands |
| `mobbin` (MCP, remote) | `https://api.mobbin.com/mcp`, same config file, OAuth | ⚠️ needs authentication |

To finish Mobbin:

1. Run `/mcps` in OpenCode (or `opencode mcp auth mobbin`).
2. Sign in to Mobbin in the browser that opens. Requires **Pro, Team or Enterprise** — MCP is not on the free plan.
3. Re-check with `opencode mcp list`; it should say `connected`.

What the Mobbin server gives an agent: `search_screens`, `search_flows`,
`search_sections`, plus save/list/comment on collections. Results carry the
product name, app context and a canonical Mobbin URL — always keep those when a
reference is actually used, and never copy branding/assets verbatim.

Optional (Team plan): the REST API `POST https://api.mobbin.com/v1/screens/search`
with a workspace bearer key, if you later want Mobbin pulls inside a script.

---

## 2. Stack decision for the RN app

The web app already uses Tailwind + Radix + `class-variance-authority` + lucide.
Mirror that 1:1 on mobile so one design language covers both:

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | Expo SDK 56 / RN 0.85.3 / React 19.2, New Architecture | what `mobile/` is scaffolded on |
| Styling | **NativeWind 4.2** (Tailwind 3.4) | `cn()`, variants and utility tokens carry over from `tailwind.config.ts` |
| Components | **React Native Reusables** (`npx @react-native-reusables/cli@latest add button`) | the literal shadcn port: same names, copy-in source, you own the files |
| Behavior/a11y | `@rn-primitives/*` | Radix port; keeps dialog/sheet/select accessibility upstream |
| Icons | `lucide-react-native` | already on web via `lucide-react` |
| Motion | Reanimated 4 (+ Moti for enter/exit) | 60fps, UI thread |
| Navigation | Expo Router (tabs + stack) | file-based, matches Next mental model |
| Haptics | `expo-haptics` | add-to-bag, qty change, tab switch |
| Images | `expo-image` | caching, `contentFit`, transitions |

Upgrade path (not needed now): NativeWind 5 / Uniwind + Expo 57 are supported by RNR
when you want Tailwind v4 utilities. Both are drop-in for this token setup.

Alternatives, only if a constraint pushes you there:

- **HeroUI Native v1** (stable since Mar 2026, Tailwind v4 via Uniwind) — installed dependency with animations/a11y baked in, faster start, less control.
- **gluestack-ui v5** (stable Jun 2026, NativeWind v5) — biggest copy-in set, dropped Next.js support.
- **React Native Paper** — only if you want Material 3 instead of your shadcn look.

Migration note: RNR copied files still depend on `@rn-primitives/*`; copy-in
buys restyle freedom, not a zero-dependency tree. Upstream fixes need
`add --overwrite`.

---

## 3. Token port (web HSL → RN hex)

Source of truth: `app/app/globals.css`. **Implemented** in `mobile/global.css`
(same HSL values, consumed by NativeWind) and mirrored for navigation in
`mobile/lib/theme.ts`. These are the exact shadcn slate values, already
contrast-corrected the way the web file does it (`muted-foreground` → `#475569`
instead of slate-500, so body text passes WCAG AA on light surfaces).

Hex equivalents, for anywhere HSL cannot be used (native theme objects, charts,
`LinearGradient`, chart/xp libs):

```ts
// mobile/theme/tokens.ts
export const light = {
  background: '#FFFFFF',
  foreground: '#020817',
  card: '#FFFFFF',
  cardForeground: '#020817',
  popover: '#FFFFFF',
  popoverForeground: '#020817',
  primary: '#0F172A',
  primaryForeground: '#F8FAFC',
  secondary: '#F1F5F9',
  secondaryForeground: '#0F172A',
  muted: '#F1F5F9',
  mutedForeground: '#475569',   // AA-corrected (web uses hsl 215.4 16.3% 46.9%)
  accent: '#F1F5F9',
  accentForeground: '#0F172A',
  destructive: '#B91C1C',       // AA-corrected from #EF4444 for white text
  destructiveForeground: '#F8FAFC',
  border: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#020817',
  radius: 8,                    // 0.5rem
};

export const dark = {
  background: '#020817',
  foreground: '#F8FAFC',
  card: '#020817',
  cardForeground: '#F8FAFC',
  popover: '#020817',
  popoverForeground: '#F8FAFC',
  primary: '#F8FAFC',
  primaryForeground: '#0F172A',
  secondary: '#1E293B',
  secondaryForeground: '#F8FAFC',
  muted: '#1E293B',
  mutedForeground: '#94A3B8',
  accent: '#1E293B',
  accentForeground: '#F8FAFC',
  destructive: '#7F1D1D',
  destructiveForeground: '#F8FAFC',
  border: '#1E293B',
  input: '#1E293B',
  ring: '#CBD5E1',
  radius: 8,
};
```

Export the same names as CSS variables in `global.css` (`@theme`) so class names
like `bg-background text-foreground border-border` behave identically on both
platforms. Never hardcode a hex in a screen.

### Mobile-only scale additions

```ts
export const space  = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 };
export const radius = { sm: 6, md: 8, lg: 12, xl: 16, full: 999 };
export const type   = {
  display: { size: 30, line: 36, weight: '700', tracking: -0.6 },
  h1:      { size: 24, line: 30, weight: '700', tracking: -0.4 },
  h2:      { size: 20, line: 26, weight: '600', tracking: -0.3 },
  body:    { size: 15, line: 22, weight: '400' },
  label:   { size: 13, line: 18, weight: '500' },
  caption: { size: 12, line: 16, weight: '400' },
};
```

Web `1rem` body does not translate: 15–16px with 22px line height is the mobile
readable default. Screen gutter is 16, card gap 12, tap target ≥ 44×44.

---

## 4. Mobbin query playbook per screen

Run these through `search_screens` / `search_flows` once authenticated, keep 3–5
captures per screen in a collection (e.g. "ecom mobile → checkout"), and record
**product + URL + the one decision worth stealing**. Adapt, don't clone.

| Screen (route) | Mobbin queries | What to extract |
| --- | --- | --- |
| Home `(store)/page` | "ecommerce home feed with hero and category rail", "storefront home personalized recommendations" | first-fold density, hero height vs. fold, section header pattern, horizontal rail peek |
| Category / listing `products`, `categories` | "product grid with filters bottom sheet", "ecommerce category page with sticky filter bar" | grid 2-col vs 2.2-col peek, sort/filter affordance placement, chip row behavior |
| Filters | "filter bottom sheet with price range and chips" | sheet height steps, apply-button stickiness, live-count badges, reset affordance |
| PDP `products/[slug]` | "product detail page with size selector", "PDP with sticky add to cart bar", "product gallery full screen zoom" | gallery behavior, variant selector, reviews placement, sticky CTA + safe-area handling |
| Cart `cart` | "cart with quantity stepper and promo code", "empty cart state" | stepper sizing, line-item density, order-summary collapse, empty state CTA |
| Checkout `checkout` | "checkout flow address to payment", "mobile checkout with express pay buttons", "checkout order summary collapsible" | step model (single page vs. 3 steps), express-pay placement, form field density, error states |
| Auth `(auth)/login`, `register` | "login screen with social auth", "sign up with phone verification" | button hierarchy, input styling, error placement, keyboard handling |
| Search `search` | "search screen with recent and trending suggestions", "search with empty results state" | suggestion grouping, cancel affordance, no-results recovery |
| Track order `track-order` | "order tracking timeline", "delivery tracking with map" | timeline density, status iconography, ETA presentation |
| Account `user`, `dashboard` | "account settings list with grouped rows", "orders list with status pills" | grouped row pattern, chevron/nav conventions, empty states |
| Loyalty / referral `components/loyalty`, `components/referral` | "loyalty points card and rewards", "referral invite screen with share sheet" | points card visual, progress-to-next-tier, share affordance |
| Notifications | "push permission priming screen" | pre-permission prompt wording and timing |

Flow searches matter more than screens for checkout, onboarding and verification —
those are sequences, not stills.

---

## 5. "Best design" rules to hold across every screen

1. **Thumb zone**: primary actions in the bottom third; nothing critical in the top 20%.
2. **One primary action per screen.** Sticky bottom CTA for PDP/cart/checkout with `useSafeAreaInsets()`.
3. **Bottom tab bar ≤ 5 items**, icons + labels, active state = primary color, not a raised FAB.
4. **16pt gutters, 12pt card gaps, 12pt radius** for cards, 8pt for inputs/buttons — consistent with `--radius`.
5. **Every list has 4 states**: loading skeleton, empty, error + retry, populated. Empty states get an icon, one sentence, one action.
6. **Sheets over modals** for filters, variants, and pickers (`@rn-primitives/dialog` → native sheet feel with snap points).
7. **Images**: `expo-image` with `contentFit="cover"`, blurhash placeholder, explicit aspect ratio to avoid layout shift.
8. **Text**: never below 12px; `allowFontScaling` on; one screen = max 2 type weights beyond body.
9. **Dark mode** ships day one (tokens above are complete); test both before calling a screen done.
10. **Haptics** on add-to-cart, quantity change, tab switch — cheap, huge perceived-quality win.
11. **Keyboard**: `KeyboardAvoidingView` + `keyboardShouldPersistTaps` on every form; submit button reachable without dismissing.
12. **Motion**: 200–300ms, `ease-out`; respect `useReducedMotion()` (the web app already respects `prefers-reduced-motion`).
13. **Contrast**: match the web fixes — muted text `#475569` on light, destructive `#B91C1C`.
14. **Don't copy protected design.** Extract the pattern (hierarchy, spacing, flow), rebuild with your tokens.

---

## 6. Working loop

```
research (Mobbin)  →  tokens/theme  →  RNR component  →  screen  →  device screenshot  →  compare vs. reference
```

- Component before screen: if a screen needs two new buttons, add the variant to the
  RNR button first, not an inline style.
- `npx @react-native-reusables/cli@latest add <component>` — then edit the file in
  `mobile/components/ui/`; that is the point of the copy-in model.
- Use the connected `shadcn` MCP to look up a web component's exact markup/variants
  when porting a screen that already exists in `app/` — keeps web and native aligned.
- Save device screenshots to `reports/device-shots/` (folder already exists there for web).
