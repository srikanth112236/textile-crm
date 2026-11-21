# P8 — Launch & Rollback Runbook

## 1. Release shape

This release is shipped behind independent flags. The old storefront path stays
live until the matching flag is enabled.

| Flag | Controls | Default |
|---|---|---|
| `NEXT_PUBLIC_FF_NEW_AUTH` | Login modal, return-to-page, no dashboard hijack | OFF |
| `NEXT_PUBLIC_FF_STAFF_GUARD` | Staff banner/nav/route guard | OFF |
| `NEXT_PUBLIC_FF_BULK_IMPORT` | Bulk import menu/routes | OFF |
| `NEXT_PUBLIC_FF_IG_REELS` | Reel admin + PDP/UGC playback | OFF |
| `NEXT_PUBLIC_FF_NEW_HOME` | Homepage v2 | OFF |
| `NEXT_PUBLIC_FF_NEW_FILTERS` | Filter rail + mobile sheet | OFF |

Server-side equivalents accept `FF_*` first, then `NEXT_PUBLIC_FF_*`.

## 2. Pre-launch checklist

- [ ] Production env vars set: API URL, NextAuth URL/secret, site URL, flags.
- [ ] MongoDB backup / snapshot taken.
- [ ] `npm run build` passes in `app/` and `server/`.
- [ ] `npx tsc --noEmit` reviewed; no new errors in changed files.
- [ ] `GET /api/health` returns 200 and `mongodb: connected`.
- [ ] `GET /api/admin/system/health` returns 200 for admin.
- [ ] Admin can load `/admin/products`, `/admin/products/import`, `/admin/media`.
- [ ] A 25-row import validates and commits as drafts.
- [ ] Test Reel URL saves and plays on PDP.
- [ ] Guest add-to-cart prompts login and replays after sign-in.
- [ ] Admin/superadmin sees no cart/wishlist/buy controls.
- [ ] Mobile 390px: home, listing, PDP, filters, login sheet.
- [ ] A11y: `npx playwright test tests/e2e/a11y/public.spec.ts --project=a11y-public`.
- [ ] Sitemap includes active products/categories; admin routes excluded.

## 3. Rollout sequence

1. **Staging** — all flags ON for staff. Run P0–P8 Playwright suites.
2. **Staff preview** — new auth/nav/home for staff accounts only; collect notes.
3. **10% customer canary** — new home + filters; watch LCP, ATC, login completion.
4. **50%** — enable auth, staff guard, reels.
5. **100%** — enable bulk import + media health last (admin-only blast radius).
6. **Cleanup** — remove old homepage components after one quiet week.

## 4. Rollback

Turn the flag OFF first. Never hotfix a broken phase by reverting unrelated code.

| Symptom | First action |
|---|---|
| Checkout/add-to-cart broken | `FF_NEW_AUTH=false`, `FF_STAFF_GUARD=false` |
| Homepage LCP/CLS regression | `FF_NEW_HOME=false` |
| Filter sheet unusable | `FF_NEW_FILTERS=false` |
| Reel iframe hurts performance/CSP | `FF_IG_REELS=false` |
| Import creates bad products | Stop the job, rollback within 24h, disable import route |
| Staff can shop | Keep backend 403; set `FF_STAFF_GUARD=true` or revert UI deploy |

### Import rollback

1. Open `/admin/products/import/history`.
2. Find the job, confirm it is `completed` and within 24 hours.
3. Click **Rollback** (superadmin only).
4. Verify created products are gone and updated products restored.
5. Check audit log for the rollback entry.

If the rollback snapshot is missing/expired, restore from the MongoDB backup.

## 5. On-call checks

- `GET /api/health` — API/Mongo up.
- `/admin/system` — Mongo, Redis, Elasticsearch, counts, flags, recent imports.
- Server logs — `[app-error]`, import worker failures, auth 401 spikes.
- Browser console — hydration errors, CSP frame-src violations.
- Import worker: progress should advance every chunk (50 rows). A stuck
  `importing` job becomes `failed` after a restart and can be **Resumed**.

## 6. Performance targets

- LCP ≤ 2.5s mobile p75
- INP ≤ 200ms p75
- CLS ≤ 0.1
- Initial JS ≤ 200KB gzip
- Hero image is the only `priority` image
- Instagram iframe loads only after click

## 7. Accessibility

Current automated coverage:
- Home, listing, PDP, search, cart, about, track-order
- Run with `npx playwright test tests/e2e/a11y/public.spec.ts --project=a11y-public`

Manual checks before launch:
- Keyboard-only login modal and mobile filter sheet
- Screen-reader labels on filter chips and icon-only buttons
- Contrast on promotional labels and amber eyebrows
- Reduced-motion preference

## 8. Load test result

P8 acceptance run:
- **2,000 rows** CSV
- Validation: **0.78s**
- Commit: **40.42s**
- Result: **2,000 created, 0 failed**
- Health after: `status=ok`, Mongo connected, ~97 MB heap / ~646 MB RSS
- Test data cleaned up

## 9. Post-launch metrics

Watch:
- Login completion and return-to-action rate
- Staff 403 attempts from UI (target: near zero)
- Import success/error rate and time per 1,000 rows
- Reel play rate and PDP conversion from video viewers
- Homepage scroll depth / category CTR / ATC
- Filter apply rate, zero-result rate, mobile filter abandonment
- Error rate by route and API status distribution

## 10. Definition of Done

- All P0–P8 gates signed off.
- No P0/P1 accessibility issue open.
- Flags have documented rollback.
- Import rollback rehearsed.
- Runbook shared with support.
- Release notes published.
