# Mentoos E-Commerce — 100% Implementation Plan
Based on PDF Requirements (33 Requirements) | Current Status: ~75%

---

## OVERVIEW
**Target:** 100% compliance with all 33 requirements in `mentoos.pdf`
**Phases:** 3 (Launch Essentials → Post Launch → Lock & Audit)
**Timeline:** 4-6 weeks (balanced dev split: 60% backend / 40% frontend)

---

## PHASE 1: ESSENTIALS — Requirements 1-28 (Launch Readiness)
*Goal: Close all gaps in core customer journey (Discover → Purchase → Confirm → Track)*

### 1. Design & UX → 100%
- [ ] Optimize all hero banners for mobile (< 200KB/WebP) in `public/` / image CDN
- [ ] Add `prefers-reduced-motion` CSS in `globals.css`
- [ ] Audit typography scale (`tailwind.config.ts`) for 16px base / 1.2 line-height

### 2. Header & Navigation → 100%
- [ ] Build mega-menu desktop component (`components/navigation/MegaMenu.tsx`) with category grid
- [ ] Mobile expandable drawer (`components/navigation/MobileMenuDrawer.tsx`) with accordion sections
- [ ] Ensure 1-2 click navigation to product categories (`(store)/categories/[slug]/page.tsx`)

### 3. Smart Search → 100%
- [ ] Implement SKU/product code search in `server/src/controllers/productController.ts` (`searchProducts` query param `sku`)
- [ ] Add spelling correction / fuzzy matching library (`fuse.js`) in `lib/search/fuzzySearch.ts`
- [ ] Add popular/recent searches storage (`localStorage` + `GET /api/search/suggestions`)
- [ ] Show image thumbnails in search dropdown (`components/search/SmartSearchModal.tsx`)

### 4. Homepage → 100%
- [ ] Verify all 14 sections present: Hero → Category → New Arrivals → Trending → Best Sellers → Shop by Fit → Shop by Style → Shop the Look → Reviews → UGC → Instagram → Offers → Trust → Footer
- [ ] Add lazy loading (`next/image`) to all homepage images
- [ ] Ensure no broken links to missing sections

### 5. Shop by Category → 100%
- [ ] Confirm visual cards for: T-Shirts, Shirts, Formal/Casual Trousers, Joggers, Shorts, Gym T-Shirts, Gym Vests, Sweatshirts, Jackets, Kurta, Kurta Pajama, Nehru Jackets, Boxers (`components/store/CategoryGrid.tsx`)

### 6. Collection / PLP → 100%
- [ ] Confirm product card displays: image, name, price, MRP, discount %, rating, color dots, available sizes, badges (`Bestseller`, `New`, `Trending`, `Limited`, `Sale`), wishlist icon (`WishlistClient`), Quick View, Quick Add (`components/products/ProductCard.tsx`)

### 7. Product Filters & Sorting → 100%
- [ ] Confirm category-specific filters (`server/src/routes/productRoutes.ts`): Size, Color, Price, Fit (`FitType`), Fabric (`Fabric`), Pattern, Occasion, Rating, Discount %, Availability
- [ ] Confirm sort options: Recommended, Newest, Best Selling, Price Low→High, Price High→Low, Discount, Customer Rating
- [ ] Mobile `FILTER | SORT` bar sticky (`components/store/FilterSortBar.tsx`)

### 8. Product Detail Page → 100%
- [ ] Confirm all elements: multiple images (`ProductGallery`), video (`ProductVideo`), image zoom (`zoom` lib), mobile swipe, name, rating/review count, price/MRP/discount, color selection (`ColorSelector`), size selection (`SizeSelector`), Size Guide (`SizeGuide`), model info (height, size worn), description, fabric info (`FabricInfo`), fit info (`FitInfo`), wash care (`WashCare`), delivery info, return/exchange info, pincode checker (`PincodeChecker`), wishlist (`WishlistButton`), Add to Cart (`AddToCart`), Buy Now (`BuyNowButton`)

### 9. Size Guide & Size Selection → 100%
- [ ] Ensure size buttons (`S | M | L | XL | XXL`) with sold-out state (`strikethrough` / disabled)
- [ ] Size measurements table (`Chest`, `Shoulder`, `Length`, `Waist`, `Hip`, `Thigh`, `Bottom`, `Sleeve`) per category in `models/Product.ts` / `components/products/SizeGuide.tsx`
- [ ] Add `Find My Size` recommendation engine (`components/products/FindMySize.tsx`) — basic version: user enters height/weight/fit preference → recommend size

### 10. Quick View → 100%
- [ ] Confirm modal (`components/products/QuickViewModal.tsx`) shows: images, name, price, discount, rating, color, size, size guide link, Add to Cart, Buy Now, View Full Product button
- [ ] Route: open via collection page without page reload (`/api/products/[id]/quick` endpoint)

### 11. Quick Add → 100%
- [ ] Confirm flow: collection card → Quick Add button → Size selector modal (`QuickAddSizeModal`) → Add to Cart (`POST /api/cart/items`)
- [ ] Ensure customer does not need PDP

### 12. Shop the Look / Smart Recommendations → 100%
- [ ] Confirm `shopLookRoutes/controller/model` linked to `Product` (`frequentlyBoughtTogether`, `styleMatch`)
- [ ] Confirm `Shop the Look` section shows complementary products based on color/style/fit (`components/store/ShopTheLook.tsx`)
- [ ] Confirm `ADD ALL TO CART` button (`components/store/ShopLookAddAll.tsx`)

### 13. UGC & Customer Reviews → 100%
- [ ] Confirm reviews: star rating (`ReviewStars`), written text (`ReviewForm`), customer photos (`ReviewPhotoUpload`), verified purchase badge (`VerifiedPurchaseBadge`), review count, helpful votes (`HelpfulVoteButton`)
- [ ] Confirm UGC videos (`UgcReels`) with vertical/Reels-style format
- [ ] Confirm `REAL CUSTOMERS. REAL STYLE.` / `WORN BY THE COMMUNITY` homepage sections (`components/store/UgcSection.tsx`)

### 14. Instagram / Social Integration → 100%
- [ ] Confirm `InstagramFeed.tsx` displays selected posts
- [ ] Confirm product tagging links (`InstagramProductTag` component) where supported
- [ ] Confirm fallback if API unavailable (`SocialFallback.tsx` with static images)
- [ ] Confirm admin can select featured UGC (`admin/` settings endpoint `settingsController`)

### 15. Wishlist → 100%
- [ ] Confirm wishlist button on cards (`WishlistButton`) and PDP (`WishlistButton`)
- [ ] Confirm save/remove (`POST /api/wishlist/:productId`, `DELETE /api/wishlist/:productId`)
- [ ] Confirm move to cart (`MoveToCartButton` in wishlist page)
- [ ] Confirm price-drop alerts (`PriceDropAlert` component linked to `alertsRoutes`)
- [ ] Confirm back-in-stock alerts (`BackInStockAlert` linked to `wishlist` + `alerts`)

### 16. Back-in-Stock Alert → 100%
- [ ] Confirm `NOTIFY ME WHEN AVAILABLE` button (`BackInStockButton`) on out-of-stock variants
- [ ] Confirm customer provides mobile/email (`BackInStockForm`)
- [ ] Confirm WhatsApp consent checkbox (`WhatsAppConsentCheckbox`)
- [ ] Confirm notification message template (`Good News! Your Mentoos Black T-Shirt in XL is back in stock.` + `SHOP NOW` button) in `server/src/services/whatsapp.ts`

### 17. Mobile OTP Login → 100%
- [ ] Confirm flow: `LoginPage` (`(auth)/login`) → enter mobile → `POST /api/auth/otp/send` → receive OTP → `POST /api/auth/otp/verify` → JWT cookie/session
- [ ] Confirm account access pages (`user/orders`, `user/wishlist`, `user/addresses`, `user/returns`, `user/settings`) exist and work

### 18. Cart → 100%
- [ ] Confirm all elements in `CartClient.tsx`: product image, name, size, color, quantity control (`QuantitySelector`), remove (`RemoveButton`), move to wishlist (`MoveToWishlistButton`), coupon (`CouponInput`), free shipping progress (`FreeShippingProgress`), recommended products (`CompleteYourLook`), total (`CartTotal`), checkout button (`CheckoutButton`)
- [ ] Confirm `Add ₹300 more to get FREE SHIPPING` progress bar

### 19. Express Checkout → 100%
- [ ] Confirm `Buy Now` button on PDP (`BuyNowButton`) skips cart → checkout
- [ ] Confirm `Express Checkout` flow (`CheckoutClient.tsx`) with minimum steps (Shipping → Payment → Confirm)
- [ ] Confirm Guest Checkout (`GuestCheckout` option) without account creation

### 20. Payment Methods → 100%
- [ ] Confirm `UPI`, `Credit Card`, `Debit Card`, `Net Banking`, `Wallets`, `Cash on Delivery`, `Express Payment Options` (`Razorpay` config in `env.example` + `paymentController`)
- [ ] Confirm `Skip Webhook Signature` config (`SKIP_WEBHOOK_SIGNATURE`) for sandbox

### 21. COD Verification & Confirmation Payment → 100%
- [ ] Confirm `COD Confirmation Payment` amount configurable (`settingsController` endpoint: `PUT /api/settings/cod`)
- [ ] Confirm amounts: ₹49, ₹99, ₹149, ₹199, Custom, Percentage-based (`CodConfig` model/settings)
- [ ] Confirm rules by order value, pincode, customer history, risk (`CodRules` in `settingsController`)
- [ ] Confirm checkout displays: `Order Value: ₹1,499 | COD Confirmation: ₹99 | Payable at Delivery: ₹1,400`

### 22. WhatsApp Integration → 100%
- [ ] Confirm transactional templates in `whatsapp.ts`: `order_confirmed`, `payment_confirmation`, `cod_confirmation`, `packed`, `shipped`, `out_for_delivery`, `delivered`, `return_exchange_updates`
- [ ] Confirm customer service flows: tracking link (`WhatsAppTrackLink`), support (`WhatsAppSupportButton`), return/exchange (`WhatsAppReturnButton`), product enquiry (`WhatsAppEnquiryButton`)
- [ ] Confirm marketing templates (with consent): `new_arrivals`, `back_in_stock`, `price_drop`, `offers`, `abandoned_cart`

### 23. Real-Time Order Tracking → 100%
- [ ] Confirm `TRACK MY ORDER` page (`(store)/track/page.tsx` or `api/track`)
- [ ] Confirm input: `Order Number + Mobile Number`
- [ ] Confirm timeline: Confirmed → Packed → Shipped → Out for Delivery → Delivered (`OrderStatusTimeline` component)
- [ ] Confirm courier partner (`CourierName`), tracking number (`TrackingNumber`), expected delivery (`ExpectedDelivery`), status (`ShipmentStatus`), courier link (`CourierLink`)

### 24. WhatsApp Order Tracking → 100%
- [ ] Confirm message template: `Your Mentoos order is out for delivery. Expected delivery: Today` + `TRACK ORDER` button linking to tracking URL (`whatsapp.ts` line 86-90)

### 25. Delivery / Pincode Checker → 100%
- [ ] Confirm `Enter Pincode → Check Delivery` (`PincodeChecker` component on PDP + cart/checkout)
- [ ] Confirm outputs: `Expected delivery date`, `COD availability` (`CodAvailable`), `Shipping charges` (`ShippingCharges`), `Free shipping eligibility` (`FreeShippingEligible`)

### 26. Mobile Sticky Add to Cart → 100%
- [ ] Confirm sticky bar (`StickyAddToCart`) appears when user scrolls past primary `Add to Cart` area on mobile (`useScrollPosition` hook or IntersectionObserver)
- [ ] Confirm bar shows: `Price | ADD TO CART | BUY NOW`

### 27. Recently Viewed Products → 100%
- [ ] Confirm tracking (`trackRecentlyViewed` in `lib/recentlyViewed.ts`)
- [ ] Confirm display: `RECENTLY VIEWED` section with last 3-5 products (`RecentlyViewed` component on homepage/cart/dashboard)

### 28. Smart Cart Recommendations → 100%
- [ ] Confirm cart shows `Complete Your Look` / `Complete the Look` (`CartRecommendations`) based on cart items (`cartController` recommendations endpoint)
- [ ] Confirm `+ ADD` button for each recommended item (`AddRecommendationButton`)

---

## PHASE 2: POST LAUNCH — Requirements 29-33 + Phase 2 Features (Growth & Scale)
*Goal: Reach 100% on all requirements and add Phase 2 enhancements*

### 29. Inventory Management → 100%
- [ ] Confirm `inventoryRoutes/controller`: warehouses (`Warehouse` schema), stock movements (`StockMovement`), transfers (`inventory/transfer` endpoint), reorder points (`ReorderPointConfig`), reserved inventory (`ReservedInventory`), bulk CSV import/export (`BulkStockImport`)
- [ ] Confirm `warehouseStock` map in `Product` schema
- [ ] Confirm automated stock updates (`Mongoose` hooks: decrement on order create, increment on cancellation)

### 30. SEO & Marketing Tracking → 100%
- [ ] Confirm SEO URLs (`slug` in `Product`), meta titles (`MetaTitle` component), meta descriptions (`MetaDescription`), image ALT (`AltText`), product structured data (`JSON-LD` schema in `components/SEO/ProductSchema`), review structured data (`ReviewSchema`), breadcrumbs (`Breadcrumb`), sitemap (`next-sitemap.config.js`)
- [ ] Confirm Google Search Console verification (`NEXT_PUBLIC_GSC_VERIFICATION`)
- [ ] Confirm analytics: `GA4` (`NEXT_PUBLIC_GA_ID`), Shopify Analytics (`analyticsController`), Meta Pixel (`NEXT_PUBLIC_META_PIXEL_ID`), Google Ads conversion tracking (`AdsConversionTracking`)
- [ ] Confirm important events tracked in `analyticsController`: `product_view`, `search`, `add_to_cart`, `begin_checkout`, `purchase`

### 31. Admin Controls → 100%
- [ ] Confirm admin can manage: COD confirmation amount (`PUT /api/admin/settings/cod` — `settingsController`), offers (`discountController`), coupons (`Coupon` endpoint), free shipping threshold (`FreeShippingThreshold` setting), product recommendations (`admin/products/[id]/recommendations`), Shop the Look combinations (`admin/shop-look`), UGC videos (`admin/ugc` selection), homepage products (`HomepageContent` model/endpoints), product badges (`TagController` / `badge` settings), back-in-stock settings (`BackInStockConfig`), WhatsApp templates (`WhatsAppTemplate` admin endpoint), banners (`BannerController`), featured products (`FeaturedProduct` endpoint)

### 32. Performance Requirements → 100%
- [ ] Confirm image optimization: `next/image` with `WebP`, `lazy loading` (`loading="lazy"`), `priority` for above-fold images
- [ ] Confirm video optimization: lazy-loaded videos (`VideoLazyLoad`), compressed formats
- [ ] Confirm code splitting (`dynamic` imports for heavy components like `CheckoutClient`)
- [ ] Confirm font optimization (`font-display: swap`, subset loading)
- [ ] Confirm script minimization: audit `next.config.js` bundles; remove unused Shopify apps/scripts (`removeUnusedApps` audit)
- [ ] Confirm third-party script minimization: only essential scripts (Razorpay SDK, WhatsApp widget, GA4, Meta Pixel) loaded conditionally
- [ ] Confirm mobile/4G load test: Lighthouse Performance > 90, Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms)
- [ ] Confirm monitoring script (`monitor-core-web-vitals` in `lib/performance/monitor.ts`)

### 33. Development Priority — Phase 2 Features (Not in 1-28, Must Be Completed)
*These are the 10 Phase 2 items from `PLAN.md` / `FEATURE_SUGGESTIONS.md`*
- [ ] Price-drop notifications (`alertsController` + `PriceDropNotification` component)
- [ ] Recently viewed (enhanced personalization) → linked to homepage/dashboard
- [ ] Advanced product recommendations (`recommendationEngine` service with collaborative filtering)
- [ ] Frequently Bought Together (`FrequentlyBoughtTogether` component + endpoint)
- [ ] Customer video reviews (`VideoReviewForm` + `VideoReviewGallery`)
- [ ] Find My Size (`FindMySize` recommendation based on measurements — enhance current basic version)
- [ ] Personalized recommendations (`PersonalizedRecommendations` endpoint using purchase/browsing history)
- [ ] Advanced WhatsApp automation (`WhatsAppAutomationService` with queued messages, scheduled campaigns)
- [ ] Loyalty program (`loyaltyController` / `LoyaltyPoints` — points earning/redeem, history, dashboard)
- [ ] Referral program (`referralController` / `ReferralLink`, invite tracking, reward mechanism)

---

## PHASE 3: FINAL LOCK & 100% AUDIT
*Goal: Verify every single requirement is met and document proof*

### Audit Checklist (Run Per Requirement)
- [ ] Run E2E test (`npm run test:e2e` in `app/`) for each customer journey: Discover → Search → Browse → Filter → PDP → Size → Quick View → Quick Add → Wishlist → Add to Cart → Checkout (Guest + Login) → COD Verification → Payment → Order Confirm → WhatsApp Confirm → Tracking → Delivery
- [ ] Verify backend endpoints respond correctly (`npm test` in `server/` — `jest` coverage > 80%)
- [ ] Verify SEO sitemap generation (`npm run build` in `app/` produces `/sitemap.xml`)
- [ ] Verify performance metrics (`npm run build` + Lighthouse audit) — Performance > 90, Accessibility > 95
- [ ] Verify mobile experience (test on 4G / low-bandwidth simulator)
- [ ] Verify admin controls work end-to-end (admin user creates discount, updates COD, selects UGC, updates banners)
- [ ] Verify WhatsApp templates send correctly (`whatsapp` service test)
- [ ] Verify inventory updates correctly (create order → stock decreases; cancel order → stock increases; bulk CSV import works)
- [ ] Verify all 33 PDF requirements have corresponding code/file evidence

### Final Deliverables
- [ ] `AUDIT_REPORT.md` — one line per requirement confirming file/evidence of 100% implementation
- [ ] `PERFORMANCE_REPORT.md` — Lighthouse scores, Core Web Vitals, mobile load times
- [ ] `TEST_COVERAGE.md` — Jest + Cypress coverage percentages
- [ ] `DEPLOYMENT_GUIDE.md` — production deployment checklist (environment variables, Docker, MongoDB Atlas, Redis, Razorpay production keys)

---

## FILE MAP — Where Each Requirement Is Implemented
Use this map to verify 100%:

| Requirement | Key Files (Server) | Key Files (App / Components) |
|-------------|-------------------|------------------------------|
| 1 Design/UX | — | `tailwind.config.ts`, `globals.css`, `layout.tsx` |
| 2 Navigation | `routes/productRoutes`, `routes/categoryRoutes` | `components/navigation/`, `Footer.tsx`, `layout.tsx` |
| 3 Smart Search | `controllers/productController.ts` (searchProducts) | `components/search/SmartSearchModal.tsx`, `lib/search/` |
| 4 Homepage | `routes/productRoutes` (featured, trending) | `app/page.tsx`, `components/store/` (Hero, Category, Reviews, UGC, Instagram, Offers, Trust) |
| 5 Shop by Category | `routes/categoryRoutes`, `controllers/categoryController` | `app/(store)/categories/[slug]/page.tsx`, `components/store/CategoryGrid.tsx` |
| 6 Collection/PLP | `routes/productRoutes` | `app/(store)/products/page.tsx`, `components/products/ProductCard.tsx` |
| 7 Filters/Sorting | `controllers/productController` (getProductFilters) | `components/store/FilterSortBar.tsx`, `components/store/FilterPanel.tsx` |
| 8 PDP | `routes/productRoutes`, `models/Product.ts` | `app/(store)/products/[id]/page.tsx`, `components/products/` |
| 9 Size Guide | `models/Product.ts` (size variants) | `components/products/SizeGuide.tsx`, `FindMySize.tsx`, `components/products/SizeSelector.tsx` |
| 10 Quick View | `routes/productRoutes` (quick endpoint implied) | `components/products/QuickViewModal.tsx` |
| 11 Quick Add | `routes/cartRoutes`, `controllers/cartController` | `components/cart/QuickAddButton.tsx`, `QuickAddSizeModal.tsx` |
| 12 Shop the Look | `routes/shopLookRoutes`, `controllers/shopLookController`, `models/ShopLook.ts` | `components/store/ShopTheLook.tsx`, `ShopLookClient.tsx` |
| 13 UGC/Reviews | `routes/ugcRoutes`, `routes/productRoutes` (reviews) | `components/store/UgcReels.tsx`, `components/store/CustomerReviews.tsx`, `ReviewForm.tsx` |
| 14 Instagram | — (social integration) | `components/store/InstagramFeed.tsx`, `SocialFallback.tsx` |
| 15 Wishlist | `routes/wishlistRoutes`, `controllers/wishlistController`, `models/Wishlist.ts` | `components/store/WishlistButton.tsx`, `WishlistClient.tsx`, `CompareContext.tsx` |
| 16 Back-in-Stock | `routes/alertsRoutes`, `controllers/alertsController` | `components/store/BackInStockButton.tsx`, `BackInStockForm.tsx` |
| 17 OTP Login | `routes/authRoutes`, `controllers/authController`, `controllers/otpController` | `app/(auth)/login/page.tsx`, `register/page.tsx`, `lib/auth/` |
| 18 Cart | `routes/cartRoutes`, `controllers/cartController`, `models/Cart.ts` | `components/cart/CartClient.tsx`, `CartModal.tsx`, `CouponInput.tsx`, `components/cart/` |
| 19 Express Checkout | `routes/paymentRoutes`, `controllers/paymentController` | `components/store/CheckoutClient.tsx`, `BuyNowButton.tsx`, `GuestCheckout.tsx` |
| 20 Payments | `routes/paymentRoutes`, `controllers/paymentController`, `models/Order.ts` | `components/store/PaymentOptions.tsx`, `CheckoutClient.tsx` |
| 21 COD Verification | `routes/settingsRoutes`, `controllers/settingsController` | `components/store/CodVerification.tsx`, `CheckoutClient.tsx` (COD section) |
| 22 WhatsApp | `services/whatsapp.ts` | `components/store/WhatsAppButton.tsx`, `WhatsAppTrackLink.tsx` |
| 23 Tracking | `routes/shipmentRoutes`, `controllers/shipmentController`, `models/Shipment.ts` | `components/store/TrackMyOrder.tsx`, `OrderStatusTimeline.tsx` |
| 24 WhatsApp Tracking | `services/whatsapp.ts` (message templates) | `components/store/WhatsAppButton.tsx` (tracking link) |
| 25 Pincode Checker | `routes/productRoutes` (delivery info) / `routes/orderRoutes` | `components/store/PincodeChecker.tsx` |
| 26 Sticky Add to Cart | — (UI component) | `components/store/StickyAddToCart.tsx` |
| 27 Recently Viewed | `routes/productRoutes` (recent endpoint) | `lib/recentlyViewed.ts`, `components/store/RecentlyViewed.tsx` |
| 28 Smart Recommendations | `routes/cartRoutes`, `controllers/cartController` (recommendations) | `components/cart/CartRecommendations.tsx`, `CompleteYourLook.tsx` |
| 29 Inventory | `routes/inventoryRoutes`, `controllers/inventoryController`, `models/Warehouse.ts`, `models/StockMovement.ts` | `components/admin/InventoryDashboard.tsx` |
| 30 SEO / Tracking | `controllers/analyticsController`, `routes/analyticsRoutes` | `next-sitemap.config.js`, `components/SEO/`, `next.config.js` |
| 31 Admin Controls | `routes/adminRoutes`, `controllers/adminController` | `app/admin/`, `app/admin/[feature]/page.tsx` |
| 32 Performance | — (infrastructure/code) | `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `public/` image optimization |
| 33 Phase 2 Features | `routes/loyaltyRoutes`, `routes/referralRoutes`, `routes/alertsRoutes` (price drop) | `components/store/LoyaltyDashboard.tsx`, `ReferralProgram.tsx`, `AdvancedRecommendations.tsx`, `VideoReviewForm.tsx`, `FindMySize.tsx` (enhanced) |

---

## ACTION ORDER (Exact Sequence)
1. Read `mentoos.pdf` (done — pasted above)
2. Read this plan (`MENTOOS_100_PERCENT_PLAN.md`)
3. Execute `Phase 1` tasks per file list above (start with Navigation, Search, PDP, Size Guide, Cart, Checkout, Tracking)
4. Execute `Phase 2` tasks (Inventory, SEO tracking, Admin, Performance, Phase 2 features)
5. Run `Phase 3` audit checklist
6. Confirm every requirement at 100% and generate `AUDIT_REPORT.md`

This is the complete, exact, file-level plan to take your `ecom` project from ~75% to 100% compliance with the `mentoos.pdf` requirements.
