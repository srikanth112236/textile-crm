# E-Commerce Platform Development Plan (SRS v3.0 – Dec 27, 2025)

**AI-Friendly Development Roadmap** - Structured for incremental, testable implementation with clear technical specifications.

---

## 📋 Project Overview

**Timeline**: 5-6 months (8 phases, 2-week sprints each)  
**Approach**: Agile, incremental, deployable milestones  
**Tech Stack**: MERN/Next.js 15+ (App Router), TypeScript, MongoDB, Redis, Elasticsearch, Razorpay, Socket.io  
**Reference**: Always reference `.cursorrules` for coding standards and this PLAN.md for phase guidance

**Globals**:
- **Phases**: Incremental, deployable at each phase end
- **Effort**: Person-days (4-6 devs, FE/BE balanced split)
- **Tools**: Cursor AI, Git (phase branches), Docker, Postman, Cypress/Jest
- **Features**: Full SRS compliance (RBAC, security, SSR/SEO, search, notifications, payments, loyalty/i18n)
- **Sync Strategy**: Merge prior branch at phase start; E2E test dependencies

---

## 🏗️ Project Structure Template

```
ecom/
├── server/                    # Backend (Express.js)
│   ├── src/
│   │   ├── config/           # DB, Redis, Elasticsearch configs
│   │   ├── middleware/       # Auth, RBAC, rate-limit, validation
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Business logic
│   │   ├── services/         # External services (Razorpay, email)
│   │   ├── utils/            # Helpers, validators
│   │   └── server.ts         # Express app entry
│   ├── tests/                # Jest/Supertest
│   └── package.json
├── app/                      # Frontend (Next.js 15 App Router)
│   ├── (auth)/               # Auth routes group
│   ├── (admin)/              # Admin routes group
│   ├── (store)/              # Storefront routes group
│   ├── api/                  # Next.js API routes (if needed)
│   ├── components/           # React components (Shadcn-based)
│   ├── lib/                  # Utilities, hooks, API clients
│   ├── styles/               # Global styles, design tokens
│   └── globals.css
├── docker-compose.yml        # MongoDB, Redis, Elasticsearch
├── .env.example              # Environment variables template
└── package.json              # Root workspace (optional)

```

---

## Phase 1: Setup, Auth & Security ⚙️
**Timeline**: Weeks 1-2  
**Objectives**: Secure authentication skeleton with RBAC foundation  
**Milestone**: End-to-end login/registration flow working  
**Effort**: 40 person-days (20 BE / 20 FE)  
**Risks**: Configuration complexity (mitigate with templates)

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed
- MongoDB Atlas account (or local Docker)
- Google reCAPTCHA v3 keys

### Backend Tasks (Step 1)

**1.1 Project Scaffold**
- [ ] Initialize Express.js with TypeScript
- [ ] Install core dependencies: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `validator`, `joi`
- [ ] Setup TypeScript config (`tsconfig.json`)
- [ ] Create folder structure (`server/src/` with subdirectories)
- [ ] Setup environment variables (`.env.example` with all required keys)
- [ ] Create entry point (`server/src/server.ts`)

**1.2 Database & Services Setup**
- [ ] Create `docker-compose.yml` with MongoDB, Redis services
- [ ] Setup MongoDB connection (`server/src/config/database.ts`)
- [ ] Setup Redis connection (`server/src/config/redis.ts`)
- [ ] Create health check endpoint (`GET /api/health`)
- [ ] Test Docker services startup

**1.3 Security Middleware**
- [ ] Helmet.js configuration (security headers)
- [ ] Rate limiting middleware (`express-rate-limit`: 100 req/min per IP)
- [ ] CORS configuration (whitelist frontend origin)
- [ ] Request validation middleware (validator.js)
- [ ] Error handling middleware (centralized error handler)

**1.4 JWT & RBAC Infrastructure**
- [ ] JWT utility functions (`server/src/utils/jwt.ts`): generate, verify, refresh
- [ ] RBAC middleware (`server/src/middleware/rbac.ts`): check user roles (Superadmin, Admin, User)
- [ ] Auth middleware (`server/src/middleware/auth.ts`): verify JWT, attach user to request
- [ ] Role constants/enum (`server/src/types/roles.ts`)

**1.5 User & Role Schemas**
- [ ] Create User schema (`server/src/models/User.ts`):
  - Fields: email (unique, validated), password (hashed), role (enum), mfaSecret, mfaEnabled, createdAt, updatedAt
  - Indexes: email, role
  - Methods: comparePassword, generateMFA
- [ ] Create Role schema (`server/src/models/Role.ts`) for future permission matrix
- [ ] Seed initial Superadmin user (script in `server/scripts/seed.ts`)

### Frontend Tasks (Step 2)

**2.1 Next.js Project Setup**
- [ ] Initialize Next.js 15 with TypeScript (`npx create-next-app@latest --typescript --app`)
- [ ] Install Tailwind CSS (`tailwindcss`, `autoprefixer`, `postcss`)
- [ ] Setup Tailwind config (`tailwind.config.ts`) with design tokens
- [ ] Install Shadcn UI (`npx shadcn-ui@latest init`)
- [ ] Setup global styles (`app/globals.css` with CSS variables)
- [ ] Create design token files (`styles/variables.css`, `styles/theme.css`)

**2.2 Project Structure**
- [ ] Create route groups: `(auth)`, `(admin)`, `(store)`
- [ ] Setup `lib/utils.ts` (cn helper, API client)
- [ ] Create `lib/api/` for API calls (fetch wrapper with error handling)
- [ ] Setup environment variables (`.env.local`)

**2.3 Auth UI Components**
- [ ] Login page (`app/(auth)/login/page.tsx`): form with email/password, reCAPTCHA
- [ ] Register page (`app/(auth)/register/page.tsx`): form with validation
- [ ] Reusable form components (using Shadcn Form, Input, Button)
- [ ] Auth layout (`app/(auth)/layout.tsx`): centered, minimal design

**2.4 Auth Integration**
- [ ] Install NextAuth.js (`next-auth`)
- [ ] Configure NextAuth (`app/api/auth/[...nextauth]/route.ts`): JWT strategy
- [ ] Create auth API client (`lib/api/auth.ts`): login, register, refresh functions
- [ ] Setup auth context/hooks (`lib/hooks/useAuth.ts`)

### Full-Stack Tasks (Step 3)

**3.1 MFA Implementation**
- [ ] Backend: Install `speakeasy`, `qrcode`
- [ ] Backend: MFA setup endpoint (`POST /api/auth/mfa/setup`): generate secret, QR code
- [ ] Backend: MFA verify endpoint (`POST /api/auth/mfa/verify`): validate OTP
- [ ] Backend: MFA middleware: require MFA for Superadmin/Admin routes
- [ ] Frontend: MFA setup component (QR code display, OTP input)
- [ ] Frontend: MFA verification modal/page

**3.2 CAPTCHA Integration**
- [ ] Backend: Google reCAPTCHA v3 validation middleware
- [ ] Frontend: Install `react-google-recaptcha-v3`
- [ ] Frontend: Add invisible reCAPTCHA to login/register pages
- [ ] Test CAPTCHA flow

**3.3 HTTPS & Security**
- [ ] Backend: Force HTTPS in production (middleware check)
- [ ] Frontend: Secure cookie settings (HttpOnly, SameSite, Secure in prod)
- [ ] Setup security headers in Next.js config

### Full-Stack Tasks (Step 4)

**4.1 Auth Flow Completion**
- [ ] Backend: Login endpoint (`POST /api/auth/login`): validate, generate JWT + refresh token
- [ ] Backend: Register endpoint (`POST /api/auth/register`): create user, hash password
- [ ] Backend: Refresh token endpoint (`POST /api/auth/refresh`)
- [ ] Backend: Logout endpoint (`POST /api/auth/logout`): invalidate refresh token
- [ ] Frontend: Complete login flow (redirect after success)
- [ ] Frontend: Protected route wrapper (`components/AuthWrapper.tsx`)

**4.2 Testing**
- [ ] Backend: Jest tests for auth endpoints (login, register, JWT verification)
- [ ] Backend: RBAC middleware tests
- [ ] Frontend: Cypress E2E test: complete login flow
- [ ] Frontend: Test MFA flow
- [ ] Test rate limiting

### Deliverables & Acceptance Criteria
- ✅ User can register with email/password
- ✅ User can login and receive JWT tokens
- ✅ Refresh token stored in HttpOnly cookie
- ✅ RBAC middleware blocks unauthorized access
- ✅ MFA required for Admin/Superadmin
- ✅ CAPTCHA prevents bot registrations
- ✅ Rate limiting prevents brute force
- ✅ All tests passing (80%+ coverage)

---

## Phase 2: Profile, Privacy & Notifications 👤
**Timeline**: Weeks 3-4  
**Objectives**: User profile management with real-time notifications  
**Milestone**: Profile updates, GDPR compliance, real-time notifications working  
**Effort**: 50 person-days (25 BE / 25 FE)  
**Risks**: Socket.io scaling (mitigate with Redis adapter)

### Sync Requirements
- Reuse Phase 1 auth infrastructure
- Test JWT tokens work across endpoints

### Backend Tasks (Step 1)

**1.1 Profile API**
- [ ] GET `/api/profile`: Get current user profile
- [ ] PUT `/api/profile`: Update profile (name, phone, avatar)
- [ ] GET `/api/profile/addresses`: Get user addresses
- [ ] POST `/api/profile/addresses`: Add address
- [ ] PUT `/api/profile/addresses/:id`: Update address
- [ ] DELETE `/api/profile/addresses/:id`: Delete address
- [ ] Input validation (Joi schemas)

**1.2 GDPR Compliance**
- [ ] GET `/api/profile/export`: Export all user data (JSON)
- [ ] DELETE `/api/profile`: Delete account and anonymize data
- [ ] Audit log for GDPR actions
- [ ] Data retention policy implementation

**1.3 User Model Updates**
- [ ] Add profile fields: name, phone, avatar, addresses (embedded array)
- [ ] Address schema: street, city, state, zip, country, isDefault

### Frontend Tasks (Step 2)

**2.1 Profile Pages**
- [ ] Profile page (`app/(store)/profile/page.tsx`): SSR with user data
- [ ] Profile edit form (Shadcn Form components)
- [ ] Address management UI (CRUD operations)
- [ ] Avatar upload component (image preview, file validation)
- [ ] Responsive design (mobile-first)

**2.2 GDPR UI**
- [ ] Cookie consent banner (`components/CookieConsent.tsx`)
- [ ] Privacy settings page
- [ ] Data export button (download JSON)
- [ ] Account deletion confirmation modal

### Full-Stack Tasks (Step 3)

**3.1 Socket.io Setup**
- [ ] Backend: Install `socket.io`, `socket.io-redis` (for scaling)
- [ ] Backend: Setup Socket.io server (attach to Express)
- [ ] Backend: Redis adapter for Socket.io
- [ ] Backend: Auth middleware for Socket.io (verify JWT)
- [ ] Backend: Emit events: orderUpdate, promotion, lowStockAlert
- [ ] Frontend: Install `socket.io-client`
- [ ] Frontend: Socket context (`lib/contexts/SocketContext.tsx`)
- [ ] Frontend: Toast notifications component (react-hot-toast or Shadcn toast)
- [ ] Frontend: Real-time notification display

**3.2 i18n Setup**
- [ ] Install `next-i18next`
- [ ] Create translation files (`public/locales/en`, `public/locales/es`, etc.)
- [ ] Setup i18n config
- [ ] Add language switcher component
- [ ] Currency conversion API integration (OpenExchangeRates)

### Full-Stack Tasks (Step 4)

**4.1 Email Fallback**
- [ ] Install `nodemailer`
- [ ] Email service (`server/src/services/email.ts`)
- [ ] Email templates (order confirmations, alerts)
- [ ] Fallback logic: send email if Socket.io fails
- [ ] Environment variables for SMTP

### Deliverables & Acceptance Criteria
- ✅ User can update profile and addresses
- ✅ GDPR export returns complete user data
- ✅ Account deletion anonymizes data
- ✅ Real-time notifications appear via Socket.io
- ✅ i18n supports multiple languages
- ✅ Cookie consent banner displays
- ✅ All tests passing

---

## Phase 3: Product Catalog & Admin Basics 📦
**Timeline**: Weeks 5-7  
**Objectives**: Product CRUD operations and searchable catalog  
**Milestone**: Admin can manage products, users can browse/search catalog  
**Effort**: 60 person-days (30 BE / 30 FE)  
**Risks**: Elasticsearch indexing (mitigate with mock data first)

### Sync Requirements
- Auth middleware for admin routes
- Socket.io for product update notifications

### Backend Tasks (Step 1)

**1.1 Product APIs**
- [ ] Product schema (`server/src/models/Product.ts`):
  - Fields: name, description, price, category, images (array), variations (array), stock, sku, status, reviews (embedded)
  - Indexes: name, category, sku, status
- [ ] Category schema (`server/src/models/Category.ts`): name, slug, parent (tree structure)
- [ ] GET `/api/products`: List products (pagination, filters, search)
- [ ] GET `/api/products/:id`: Get single product
- [ ] POST `/api/products`: Create product (Admin/Superadmin only)
- [ ] PUT `/api/products/:id`: Update product (Admin/Superadmin only)
- [ ] DELETE `/api/products/:id`: Delete product (Superadmin only)
- [ ] GET `/api/categories`: Get category tree
- [ ] POST `/api/categories`: Create category (Admin/Superadmin)
- [ ] Image upload: S3 integration or local storage (`multer`, `aws-sdk`)

**1.2 Elasticsearch Integration**
- [ ] Install `@elastic/elasticsearch`
- [ ] Elasticsearch connection (`server/src/config/elasticsearch.ts`)
- [ ] Product indexing service (`server/src/services/search.ts`)
- [ ] Index products on create/update/delete (Mongoose hooks)
- [ ] Search endpoint (`GET /api/products/search?q=query&filters=...`)
- [ ] "More like this" recommendations endpoint

**1.3 Stock Management**
- [ ] Stock schema/hooks: decrement on order, increment on cancellation
- [ ] Low stock detection (threshold config)
- [ ] Low stock alert via Socket.io

### Frontend Tasks (Step 2)

**2.1 Admin Product Management**
- [ ] Admin layout (`app/(admin)/layout.tsx`): sidebar navigation
- [ ] Products list page (`app/(admin)/products/page.tsx`): table with pagination
- [ ] Product form (`app/(admin)/products/[id]/page.tsx`): create/edit form
- [ ] Image upload component (drag-drop, preview, multiple images)
- [ ] Variation management UI (size, color, etc.)
- [ ] Category management page (tree view)
- [ ] RBAC: Hide admin routes from non-admin users

**2.2 Storefront Product Pages**
- [ ] Products listing page (`app/(store)/products/page.tsx`): SSR, filters, pagination
- [ ] Product detail page (`app/(store)/products/[id]/page.tsx`): SSR with meta tags
- [ ] Search page (`app/(store)/search/page.tsx`): Elasticsearch integration
- [ ] Category pages (`app/(store)/categories/[slug]/page.tsx`)
- [ ] Product card component (reusable, responsive)
- [ ] SEO: Dynamic meta tags, Open Graph, structured data

### Full-Stack Tasks (Step 3)

**3.1 Stock Sync**
- [ ] Stock display on product pages (real-time via Socket.io if needed)
- [ ] Admin stock management UI
- [ ] Low stock alerts to admin dashboard

### Deliverables & Acceptance Criteria
- ✅ Admin can CRUD products with images and variations
- ✅ Products searchable via Elasticsearch
- ✅ Product pages are SSR with SEO meta tags
- ✅ Stock updates in real-time
- ✅ Low stock alerts sent via Socket.io
- ✅ All tests passing

---

## Phase 4: Cart, Wishlist & Personalization 🛒
**Timeline**: Weeks 8-10  
**Objectives**: Shopping cart, wishlist, and product recommendations  
**Milestone**: Cart persistence, wishlist functionality, recommendations working  
**Effort**: 60 person-days (30 BE / 30 FE)  
**Risks**: Redis-DB sync (mitigate with comprehensive tests)

### Sync Requirements
- Product APIs for cart items
- Elasticsearch for recommendations

### Backend Tasks (Step 1)

**1.1 Cart APIs**
- [ ] Cart schema (`server/src/models/Cart.ts`): userId, items (array), updatedAt
- [ ] Redis cart service (`server/src/services/cart.ts`): store cart in Redis (1hr TTL), sync to DB
- [ ] GET `/api/cart`: Get user cart (check Redis, fallback to DB)
- [ ] POST `/api/cart/items`: Add item to cart
- [ ] PUT `/api/cart/items/:itemId`: Update cart item quantity
- [ ] DELETE `/api/cart/items/:itemId`: Remove item
- [ ] DELETE `/api/cart`: Clear cart
- [ ] Sync Redis to DB on cart update (background job or on checkout)

**1.2 Wishlist APIs**
- [ ] Wishlist field in User model (array of productIds)
- [ ] GET `/api/wishlist`: Get user wishlist
- [ ] POST `/api/wishlist/:productId`: Add to wishlist
- [ ] DELETE `/api/wishlist/:productId`: Remove from wishlist

### Frontend Tasks (Step 2)

**2.1 Cart UI**
- [ ] Cart context/hook (`lib/contexts/CartContext.tsx`)
- [ ] Cart icon in header (badge with item count)
- [ ] Cart modal/drawer (`components/CartModal.tsx`): display items, quantities, totals
- [ ] Add to cart button (product pages)
- [ ] Cart page (`app/(store)/cart/page.tsx`): full cart view with checkout button

**2.2 Wishlist UI**
- [ ] Wishlist icon (heart button on product cards)
- [ ] Wishlist page (`app/(store)/wishlist/page.tsx`): grid of wishlist items
- [ ] Add/remove wishlist functionality

### Full-Stack Tasks (Step 3)

**3.1 Recommendations**
- [ ] Backend: Recommendations endpoint (`GET /api/products/recommendations/:productId`)
- [ ] Backend: Use Elasticsearch "more_like_this" query
- [ ] Frontend: Recommendations component (show on product detail page)
- [ ] Frontend: "You may also like" section

**3.2 Reviews**
- [ ] Review schema (embedded in Product): userId, rating (1-5), comment, createdAt
- [ ] POST `/api/products/:id/reviews`: Submit review (authenticated users)
- [ ] GET `/api/products/:id/reviews`: Get reviews (pagination)
- [ ] Admin moderation: approve/reject reviews endpoint
- [ ] Frontend: Review form component
- [ ] Frontend: Reviews display (star ratings, pagination)
- [ ] Frontend: Admin review moderation UI

### Full-Stack Tasks (Step 4)

**4.1 Abandoned Cart Detection**
- [ ] Backend: Background job to detect abandoned carts (24hrs inactive)
- [ ] Backend: Emit Socket.io event for abandoned cart
- [ ] Frontend: Show reminder notification (optional: email fallback)

### Deliverables & Acceptance Criteria
- ✅ Cart persists in Redis and syncs to DB
- ✅ Users can add/remove wishlist items
- ✅ Recommendations show relevant products
- ✅ Users can submit and view reviews
- ✅ Abandoned carts detected and notified
- ✅ All tests passing

---

## Phase 5: Checkout, Orders & Payments 💳
**Timeline**: Weeks 11-13  
**Objectives**: Complete purchase flow with Razorpay integration  
**Milestone**: End-to-end order placement with payment processing  
**Effort**: 70 person-days (35 BE / 35 FE)  
**Risks**: PCI compliance (use Razorpay Elements, no card storage)

### Sync Requirements
- Cart APIs for checkout
- Stock sync for inventory management

### Backend Tasks (Step 1)

**1.1 Order APIs**
- [ ] Order schema (`server/src/models/Order.ts`):
  - Fields: userId, items (array), total, shippingAddress, paymentMethod, status, RazorpayPaymentIntentId, createdAt
  - Status enum: pending, processing, shipped, delivered, cancelled, refunded
- [ ] GET `/api/orders`: Get user orders (pagination)
- [ ] GET `/api/orders/:id`: Get single order
- [ ] POST `/api/orders`: Create order (from cart)
- [ ] PUT `/api/orders/:id`: Update order status (Admin only)
- [ ] POST `/api/orders/:id/cancel`: Cancel order
- [ ] POST `/api/orders/:id/repeat`: Clone order for reorder

**1.2 Razorpay Integration**
- [ ] Install `Razorpay`
- [ ] Razorpay config (`server/src/config/Razorpay.ts`)
- [ ] POST `/api/payments/create-intent`: Create Razorpay PaymentIntent
- [ ] POST `/api/payments/confirm`: Confirm payment
- [ ] Razorpay webhook handler (`POST /api/webhooks/Razorpay`): handle payment events
- [ ] Refund endpoint (`POST /api/orders/:id/refund`): Admin only
- [ ] Saved payment methods: Razorpay Customer integration

### Frontend Tasks (Step 2)

**2.1 Checkout Flow**
- [ ] Checkout page (`app/(store)/checkout/page.tsx`): multi-step form
- [ ] Checkout steps: Shipping address → Payment → Review → Confirmation
- [ ] Install `@Razorpay/Razorpay-js`, `@Razorpay/react-Razorpay-js`
- [ ] Razorpay Elements integration (CardElement)
- [ ] Payment form with validation
- [ ] Order summary component
- [ ] Order confirmation page

**2.2 Order Management**
- [ ] Order history page (`app/(store)/orders/page.tsx`): list of orders
- [ ] Order detail page (`app/(store)/orders/[id]/page.tsx`): order tracking
- [ ] Order status badge component
- [ ] Cancel order functionality

### Full-Stack Tasks (Step 3)

**3.1 Stock Decrement**
- [ ] Mongoose hook: decrement stock on order creation
- [ ] Prevent order if stock insufficient
- [ ] Increment stock on order cancellation

**3.2 Order Notifications**
- [ ] Socket.io events: orderConfirmed, orderShipped, orderDelivered
- [ ] Frontend: Show order status updates in real-time
- [ ] Email fallback for critical order updates

### Full-Stack Tasks (Step 4)

**4.1 Saved Payments**
- [ ] Razorpay Customer creation on first payment
- [ ] Store Razorpay Customer ID in User model
- [ ] GET `/api/payments/methods`: Get saved payment methods
- [ ] Frontend: Display saved payment methods in checkout
- [ ] Option to save new payment method

### Deliverables & Acceptance Criteria
- ✅ Users can complete checkout with Razorpay payment
- ✅ Orders created and stored in database
- ✅ Stock decremented on order
- ✅ Razorpay webhooks update order status
- ✅ Users can view order history and track orders
- ✅ Refunds processed via admin
- ✅ All tests passing (including Razorpay sandbox)

---

## Phase 6: Advanced Admin & Loyalty 👑
**Timeline**: Weeks 14-16  
**Objectives**: Comprehensive admin tools and loyalty program  
**Milestone**: Permission dashboard, loyalty points system working  
**Effort**: 60 person-days (30 BE / 30 FE)  
**Risks**: Permission matrix complexity (mitigate with thorough tests)

### Sync Requirements
- Order APIs for refunds
- User management for admin operations

### Backend Tasks (Step 1)

**1.1 Admin & Roles APIs**
- [ ] Permission schema (`server/src/models/Permission.ts`)
- [ ] Permission matrix endpoints (CRUD operations on permissions)
- [ ] GET `/api/admin/users`: List users (pagination, filters)
- [ ] PUT `/api/admin/users/:id`: Update user (ban, change role)
- [ ] GET `/api/admin/logs`: Get audit logs (filterable, paginated)
- [ ] User ban/unban functionality
- [ ] Role assignment endpoints

**1.2 Discounts**
- [ ] Discount schema (`server/src/models/Discount.ts`): code, type (percentage/fixed), value, minPurchase, expiry, usageLimit
- [ ] GET `/api/discounts`: List discounts (public active, admin all)
- [ ] POST `/api/discounts`: Create discount (Admin/Superadmin)
- [ ] PUT `/api/discounts/:id`: Update discount
- [ ] DELETE `/api/discounts/:id`: Delete discount
- [ ] Apply discount logic in order creation

### Frontend Tasks (Step 2)

**2.1 Admin Dashboard**
- [ ] Admin dashboard layout with dynamic sidebar
- [ ] User management page (table, filters, actions)
- [ ] Role/permission management UI (checkbox matrix)
- [ ] Audit logs viewer (table with filters)
- [ ] Discount management pages (CRUD forms)

**2.2 Reporting**
- [ ] Install chart library (`recharts` or `chart.js`)
- [ ] Sales analytics dashboard (revenue, orders over time)
- [ ] Product performance charts
- [ ] User metrics (registrations, active users)

### Full-Stack Tasks (Step 3)

**3.1 Loyalty Points**
- [ ] Loyalty schema (embedded in User): points, pointsHistory (array)
- [ ] Points earning: calculate on order completion (X points per $1)
- [ ] Points redemption: apply discount based on points
- [ ] POST `/api/loyalty/redeem`: Redeem points for discount
- [ ] Frontend: Display points balance (header, profile)
- [ ] Frontend: Points history page
- [ ] Frontend: Redeem points UI in checkout

### Full-Stack Tasks (Step 4)

**4.1 SEO & Sitemaps**
- [ ] Install `next-sitemap`
- [ ] Generate sitemap for products, categories, pages
- [ ] Dynamic meta tags on all pages
- [ ] Robots.txt configuration
- [ ] Structured data (JSON-LD) for products

### Deliverables & Acceptance Criteria
- ✅ Admin can manage users, roles, and permissions
- ✅ Permission matrix enforces access control
- ✅ Discounts can be created and applied
- ✅ Loyalty points earned and redeemed
- ✅ Analytics dashboard displays key metrics
- ✅ SEO optimized with sitemaps
- ✅ All tests passing

---

## Phase 7: Email Notifications & Communication System 📧
**Timeline**: Weeks 17-18  
**Objectives**: Comprehensive email notification system and advanced notifications  
**Milestone**: All email notifications working, notification center operational  
**Effort**: 40 person-days (20 BE / 20 FE)  
**Risks**: Email delivery reliability (mitigate with queue system)

### Sync Requirements
- Order APIs for order confirmations
- User management for email preferences
- Cart system for abandoned cart recovery

### Backend Tasks (Step 1)

**1.1 Email Service Setup**
- [ ] Install `nodemailer`, `bull` (or `bullmq`) for job queues
- [ ] Email service (`server/src/services/email.ts`): SMTP configuration
- [ ] Email template engine (React Email or Handlebars)
- [ ] Queue system setup (`server/src/services/emailQueue.ts`)
- [ ] Email template models: order confirmation, shipping, password reset, welcome
- [ ] Environment variables for SMTP (SendGrid/Resend/AWS SES)

**1.2 Email Notification Endpoints**
- [ ] POST `/api/notifications/preferences`: Update notification preferences
- [ ] GET `/api/notifications/preferences`: Get user notification settings
- [ ] Email queue worker: Process email jobs reliably
- [ ] Email template preview endpoint (Admin only)

**1.3 Core Email Notifications**
- [ ] Order confirmation email (with invoice PDF generation)
- [ ] Order status change emails (shipped, delivered, cancelled)
- [ ] Shipping notifications with tracking links
- [ ] Password reset emails
- [ ] Welcome emails for new users
- [ ] Abandoned cart recovery emails (24hr, 48hr, 72hr sequence)
- [ ] Loyalty points earned/redeemed notifications
- [ ] Low stock alerts to admins

**1.4 Abandoned Cart Detection**
- [ ] Cart tracking with last updated timestamp
- [ ] Background job to detect abandoned carts (24hrs inactive)
- [ ] Generate personalized discount codes for cart recovery
- [ ] Email queue integration for cart recovery sequence
- [ ] Cart recovery analytics (track recovery rate)

### Frontend Tasks (Step 2)

**2.1 Notification Center**
- [ ] Notification preferences page (`app/(store)/profile/notifications/page.tsx`)
- [ ] In-app notification center component (`components/NotificationCenter.tsx`)
- [ ] Notification bell icon in header with badge count
- [ ] Notification dropdown/modal with list
- [ ] Mark as read/unread functionality
- [ ] Notification categories (orders, promotions, account, etc.)

**2.2 Email Template Management (Admin)**
- [ ] Admin email templates page (`app/admin/notifications/templates/page.tsx`)
- [ ] Email template editor (visual editor for templates)
- [ ] Template preview functionality
- [ ] Test email sending from admin panel

**2.3 Abandoned Cart UI**
- [ ] Admin abandoned cart dashboard (`app/admin/carts/abandoned/page.tsx`)
- [ ] Cart recovery analytics display
- [ ] Manual email trigger for admins
- [ ] Cart recovery rate metrics

### Full-Stack Tasks (Step 3)

**3.1 Email Integration Points**
- [ ] Integrate order confirmation emails in order creation
- [ ] Integrate shipping notifications in order status updates
- [ ] Integrate password reset emails in auth flow
- [ ] Integrate welcome emails in user registration
- [ ] Integrate cart recovery in cart update hooks

**3.2 Notification Preferences**
- [ ] User notification preferences model (email, SMS, push, in-app)
- [ ] Preference-based email filtering
- [ ] Unsubscribe functionality

### Deliverables & Acceptance Criteria
- ✅ All core email notifications working and tested
- ✅ Email queue system processing jobs reliably
- ✅ Abandoned cart recovery emails automatically sent
- ✅ Notification center displays in-app notifications
- ✅ Users can manage notification preferences
- ✅ Admin can preview and manage email templates
- ✅ Cart recovery analytics tracking
- ✅ All tests passing

---

## Phase 8: Product Enhancements & Discovery 🎯
**Timeline**: Weeks 19-21  
**Objectives**: Enhanced product reviews, tags, and personalized recommendations  
**Milestone**: Rich product reviews, tags, and recommendation engine working  
**Effort**: 50 person-days (25 BE / 25 FE)  
**Risks**: Recommendation algorithm complexity (start with simple collaborative filtering)

### Sync Requirements
- Product APIs for reviews and tags
- User purchase/browsing history for recommendations
- Elasticsearch for recommendation queries

### Backend Tasks (Step 1)

**1.1 Product Reviews Enhancement**
- [ ] Update Review schema: add photo/video URLs, helpful votes count, verified purchase flag
- [ ] POST `/api/products/:id/reviews/photos`: Upload review photos
- [ ] POST `/api/reviews/:id/helpful`: Vote helpful/unhelpful
- [ ] GET `/api/products/:id/reviews`: Enhanced with sorting (newest, highest rated, most helpful)
- [ ] Review moderation workflow: approve/reject with admin notes
- [ ] Review analytics: sentiment analysis, rating trends
- [ ] Verified purchase badge logic (check if user ordered product)

**1.2 Product Tags System**
- [ ] Tag schema (`server/src/models/Tag.ts`): name, slug, description, color, isActive
- [ ] Product schema update: add tags array (reference to Tag)
- [ ] GET `/api/tags`: List all tags (public active, admin all)
- [ ] POST `/api/tags`: Create tag (Admin/Superadmin)
- [ ] PUT `/api/tags/:id`: Update tag
- [ ] DELETE `/api/tags/:id`: Delete tag
- [ ] Tag-based product filtering
- [ ] Tag analytics: which tags drive most sales

**1.3 Personalized Recommendations**
- [ ] User browsing history tracking (Redis + MongoDB)
- [ ] User purchase history aggregation
- [ ] Recommendation service (`server/src/services/recommendations.ts`)
- [ ] GET `/api/products/recommendations`: Personalized recommendations
- [ ] Collaborative filtering algorithm (users who bought X also bought Y)
- [ ] Content-based filtering (similar products by category/features)
- [ ] "Recently viewed products" tracking
- [ ] Trending products calculation (sales velocity)
- [ ] Cache recommendations in Redis (1hr TTL)

### Frontend Tasks (Step 2)

**2.1 Enhanced Reviews UI**
- [ ] Review form with photo upload (`components/ReviewForm.tsx`)
- [ ] Photo gallery in reviews display
- [ ] Verified purchase badge display
- [ ] Helpful vote buttons (thumbs up/down)
- [ ] Review sorting options (newest, highest, most helpful)
- [ ] Review moderation UI (Admin): approve/reject reviews
- [ ] Review analytics dashboard (Admin): rating trends, sentiment

**2.2 Product Tags UI**
- [ ] Tag management page (Admin): `app/admin/products/tags/page.tsx`
- [ ] Tag selection in product form (multi-select)
- [ ] Tag badges on product cards (`components/ProductTag.tsx`)
- [ ] Tag filter in product listing (sidebar filter)
- [ ] Tag analytics dashboard (Admin): tag performance metrics

**2.3 Recommendations UI**
- [ ] "Recommended for you" section (`components/ProductRecommendations.tsx`)
- [ ] "Customers who bought this also bought" component
- [ ] "Recently viewed products" section
- [ ] "Trending products" section
- [ ] Personalized homepage recommendations
- [ ] Recommendations on product detail page

### Full-Stack Tasks (Step 3)

**3.1 Review Photo Upload**
- [ ] Image upload integration for review photos
- [ ] Photo validation and resizing
- [ ] Photo storage (local/S3)
- [ ] Photo moderation (Admin approval before display)

**3.2 Recommendation Engine Integration**
- [ ] Track product views in Redis
- [ ] Sync browsing history to MongoDB (periodic)
- [ ] Calculate recommendations on-demand (cache results)
- [ ] Fallback recommendations (trending/popular) if no history

### Deliverables & Acceptance Criteria
- ✅ Users can upload photos with reviews
- ✅ Review helpful voting system working
- ✅ Verified purchase badges display correctly
- ✅ Product tags can be created and assigned
- ✅ Tag filtering works in product listings
- ✅ Personalized recommendations show relevant products
- ✅ Admin can moderate reviews and view analytics
- ✅ All tests passing

---

## Phase 9: Advanced Admin Features & Analytics 📊
**Timeline**: Weeks 22-24  
**Objectives**: Enhanced inventory management, advanced analytics, and order management  
**Milestone**: Comprehensive admin dashboard with advanced analytics  
**Effort**: 60 person-days (30 BE / 30 FE)  
**Risks**: Analytics performance with large datasets (optimize with aggregations)

### Sync Requirements
- Product APIs for inventory management
- Order APIs for order management enhancements
- User data for analytics

### Backend Tasks (Step 1)

**1.1 Inventory Management Enhancements**
- [x] Warehouse schema (`server/src/models/Warehouse.ts`): name, address, isActive
- [x] Product schema update: add warehouseStock (map: warehouseId → quantity)
- [x] Stock movement schema (`server/src/models/StockMovement.ts`): product, warehouse, type (in/out/transfer), quantity, reason, userId
- [x] GET `/api/inventory/warehouses`: List warehouses
- [x] POST `/api/inventory/warehouses`: Create warehouse (Admin/Superadmin)
- [x] POST `/api/inventory/transfer`: Transfer stock between warehouses
- [x] GET `/api/inventory/movements`: Stock movement history
- [x] Automated reorder points (configurable per product)
- [x] Reserved inventory tracking (for pending orders)
- [x] Bulk stock update endpoint (CSV import support)
- [x] Stock forecasting algorithm (based on sales trends)

**1.2 Advanced Analytics APIs**
- [x] Analytics controller enhancement (`server/src/controllers/analyticsController.ts`)
- [x] Sales forecasting endpoint: predict future sales
- [x] Customer lifetime value (CLV) calculation
- [x] Conversion funnel analysis
- [x] Revenue by product category/time period
- [x] Geographic sales distribution
- [x] Cohort analysis (customer retention over time)
- [x] Product performance analytics (best/worst sellers with trends)
- [x] Export reports endpoint (PDF, CSV, Excel generation)

**1.3 Order Management Enhancements**
- [x] Order schema update: add notes, flags, priority, assignedTo
- [x] POST `/api/orders/bulk-update`: Bulk status updates
- [x] POST `/api/orders/:id/notes`: Add order notes (Admin)
- [x] PUT `/api/orders/:id/priority`: Set order priority
- [x] GET `/api/orders/export`: Export orders (CSV, PDF)
- [x] Order templates endpoint (save common order configurations)
- [x] Partial order fulfillment logic
- [x] Order splitting functionality
- [x] Order merging functionality
- [x] Print packing slips endpoint (PDF generation)
- [x] Print invoices endpoint (PDF generation)

### Frontend Tasks (Step 2)

**2.1 Inventory Management UI**
- [x] Warehouse management page (`app/admin/inventory/warehouses/page.tsx`)
- [x] Multi-warehouse stock display in product management
- [x] Stock transfer interface (`app/admin/inventory/transfer/page.tsx`)
- [x] Stock movement history page (`app/admin/inventory/movements/page.tsx`)
- [x] Reorder points configuration
- [x] Stock forecasting dashboard
- [x] Reserved inventory display
- [x] Bulk stock import/export (CSV)

**2.2 Advanced Analytics Dashboard**
- [x] Enhanced analytics page (`app/admin/analytics/page.tsx`)
- [x] Sales forecasting charts (using Recharts)
- [x] CLV dashboard with customer segments
- [x] Conversion funnel visualization
- [x] Revenue breakdown charts (by category, time, geography)
- [x] Cohort analysis charts
- [x] Product performance tables with trends
- [x] Export reports UI (PDF, CSV, Excel)
- [x] Scheduled report emails configuration
- [x] Custom date range picker with comparisons

**2.3 Order Management UI Enhancements**
- [x] Order notes interface (add/view notes)
- [x] Order flags/priority markers
- [x] Bulk order operations UI
- [x] Order templates management
- [x] Partial fulfillment interface
- [x] Order splitting/merging UI
- [x] Print packing slips button
- [x] Print invoices button
- [x] Order export functionality
- [x] Order filters enhanced (by priority, flags, assigned to)

### Full-Stack Tasks (Step 3)

**3.1 Inventory Integration**
- [x] Stock allocation logic (allocate from nearest warehouse)
- [x] Stock reservation on order creation
- [x] Stock release on order cancellation
- [x] Multi-warehouse stock updates in product operations

**3.2 Analytics Data Aggregation**
- [x] Background jobs for heavy analytics calculations
- [x] Cache analytics data in Redis (15min TTL)
- [x] Optimize database queries with proper indexes
- [x] Aggregate data for faster chart rendering

**3.3 Order Workflow**
- [x] Order assignment workflow (assign to admin users)
- [x] Order priority queue system
- [x] Notification system for order updates (integrate with Phase 7)

### Deliverables & Acceptance Criteria
- ✅ Multi-warehouse inventory tracking working
- ✅ Stock transfers between warehouses functional
- ✅ Advanced analytics dashboard shows comprehensive metrics
- ✅ Order management enhanced with notes, flags, bulk operations
- ✅ Export functionality for orders and reports working
- ✅ Stock forecasting provides insights
- ✅ All admin features accessible with proper RBAC
- ✅ All tests passing

---

## Phase 10: Business Features & Marketing Tools 💰
**Timeline**: Weeks 25-27  
**Objectives**: Gift cards, dynamic pricing, and customer segmentation  
**Milestone**: Gift card system, pricing rules, and segmentation working  
**Effort**: 55 person-days (28 BE / 27 FE)  
**Risks**: Pricing rule complexity (start with simple rules, expand)

### Sync Requirements
- Order APIs for gift card redemption
- Product APIs for pricing
- User management for segmentation

### Backend Tasks (Step 1)

**1.1 Gift Cards System**
- [ ] GiftCard schema (`server/src/models/GiftCard.ts`): code, amount, balance, expiry, recipientEmail, recipientName, message, purchasedBy, status
- [ ] GET `/api/gift-cards`: List gift cards (user's purchased, admin all)
- [ ] POST `/api/gift-cards`: Purchase gift card
- [ ] POST `/api/gift-cards/redeem`: Validate and redeem gift card code
- [ ] GET `/api/gift-cards/:id`: Get gift card details
- [ ] Gift card code generation (secure, unique)
- [ ] Email delivery of gift cards
- [ ] Gift card balance tracking
- [ ] Gift card expiry handling
- [ ] Bulk gift card creation (Admin for promotions)
- [ ] Gift card analytics (usage, revenue, redemption rate)

**1.2 Dynamic Pricing & Promotions**
- [ ] PricingRule schema (`server/src/models/PricingRule.ts`): name, type (flash_sale, volume_discount, bundle, member_only), conditions, discount, startDate, endDate, isActive
- [ ] GET `/api/pricing/rules`: List active pricing rules
- [ ] POST `/api/pricing/rules`: Create pricing rule (Admin/Superadmin)
- [ ] PUT `/api/pricing/rules/:id`: Update pricing rule
- [ ] DELETE `/api/pricing/rules/:id`: Delete pricing rule
- [ ] Pricing calculation service (`server/src/services/pricing.ts`): Apply rules to products
- [ ] Flash sale logic (time-limited discounts)
- [ ] Volume discount logic (buy more, save more)
- [ ] Bundle deal logic (buy X and Y together, save Z%)
- [ ] Member-only pricing rules
- [ ] Price history tracking (for analytics)
- [ ] Competitor price tracking (optional, external API)

**1.3 Customer Segmentation**
- [ ] CustomerSegment schema (`server/src/models/CustomerSegment.ts`): name, criteria (rules), description
- [ ] GET `/api/segments`: List customer segments
- [ ] POST `/api/segments`: Create segment (Admin/Superadmin)
- [ ] PUT `/api/segments/:id`: Update segment
- [ ] DELETE `/api/segments/:id`: Delete segment
- [ ] Segment calculation service: Automatically assign users to segments
- [ ] Segment criteria: VIP (high CLV), Regular, New (registered <30 days), Inactive (no order >90 days)
- [ ] Segment-based promotions (apply pricing rules to segments)
- [ ] Segment analytics (size, average order value, retention)

### Frontend Tasks (Step 2)

**2.1 Gift Cards UI**
- [ ] Gift card purchase page (`app/(store)/gift-cards/page.tsx`)
- [ ] Gift card form (amount, recipient, message)
- [ ] User's purchased gift cards page
- [ ] Gift card redemption in checkout flow
- [ ] Gift card balance display (in profile/header)
- [ ] Admin gift card management (`app/admin/gift-cards/page.tsx`)
- [ ] Bulk gift card creation UI (Admin)
- [ ] Gift card analytics dashboard (Admin)

**2.2 Dynamic Pricing UI**
- [ ] Pricing rules management (Admin): `app/admin/pricing/rules/page.tsx`
- [ ] Create/edit pricing rule forms
- [ ] Flash sale countdown timers on product pages
- [ ] Volume discount display (e.g., "Buy 3, Save 10%")
- [ ] Bundle deal recommendations
- [ ] Member-only pricing badges
- [ ] Price history chart (Admin)
- [ ] Active promotions dashboard (Admin)

**2.3 Customer Segmentation UI**
- [ ] Customer segments management (Admin): `app/admin/customers/segments/page.tsx`
- [ ] Segment creation form with criteria builder
- [ ] Segment list with member counts
- [ ] Segment-based promotion assignment
- [ ] Segment analytics dashboard
- [ ] User segment display (Admin user view)

### Full-Stack Tasks (Step 3)

**3.1 Gift Card Integration**
- [ ] Gift card redemption in checkout flow
- [ ] Gift card balance deduction logic
- [ ] Gift card email delivery integration
- [ ] Gift card expiry cleanup job

**3.2 Pricing Rule Application**
- [ ] Apply pricing rules in product listing
- [ ] Apply pricing rules in product detail
- [ ] Apply pricing rules in cart calculation
- [ ] Cache pricing calculations (Redis, 5min TTL)
- [ ] Price display logic (show original + discounted price)

**3.3 Segmentation Integration**
- [ ] Automatic segment assignment on user actions
- [ ] Segment-based product recommendations
- [ ] Segment-based email campaigns (integrate with Phase 7)
- [ ] Segment-based homepage personalization

### Deliverables & Acceptance Criteria
- ✅ Gift cards can be purchased and redeemed
- ✅ Gift card emails delivered successfully
- ✅ Dynamic pricing rules applied correctly
- ✅ Flash sales work with countdown timers
- ✅ Customer segmentation functional with auto-assignment
- ✅ Segment-based promotions working
- ✅ Admin can manage all pricing and segmentation features
- ✅ All tests passing

---

## Phase 11: Content Management & Customization 🎨
**Timeline**: Weeks 28-30  
**Objectives**: CMS for content management and theme customization  
**Milestone**: Admin can manage content and customize store appearance  
**Effort**: 50 person-days (25 BE / 25 FE)  
**Risks**: Theme customization complexity (use CSS variables for flexibility)

### Sync Requirements
- Existing admin infrastructure
- Product/category data for homepage content

### Backend Tasks (Step 1)

**1.1 Content Management System (CMS)**
- [ ] Page schema (`server/src/models/Page.ts`): title, slug, content, metaTitle, metaDescription, status, publishedAt
- [ ] GET `/api/cms/pages`: List pages
- [ ] GET `/api/cms/pages/:slug`: Get page by slug (public)
- [ ] POST `/api/cms/pages`: Create page (Admin/Superadmin)
- [ ] PUT `/api/cms/pages/:id`: Update page
- [ ] DELETE `/api/cms/pages/:id`: Delete page
- [ ] Homepage content schema (`server/src/models/HomepageContent.ts`): sections (hero, featured products, banners, etc.)
- [ ] GET `/api/cms/homepage`: Get homepage content
- [ ] PUT `/api/cms/homepage`: Update homepage content (Admin/Superadmin)
- [ ] FAQ schema (`server/src/models/FAQ.ts`): question, answer, category, order
- [ ] FAQ CRUD endpoints
- [ ] Terms & Conditions, Privacy Policy endpoints

**1.2 Theme Customization**
- [ ] ThemeSettings schema (`server/src/models/ThemeSettings.ts`): colors, fonts, logos, favicon
- [ ] GET `/api/theme/settings`: Get theme settings (public)
- [ ] PUT `/api/theme/settings`: Update theme (Admin/Superadmin)
- [ ] Logo/favicon upload endpoints
- [ ] Theme preview endpoint (return settings without saving)
- [ ] Theme export/import functionality

### Frontend Tasks (Step 2)

**2.1 CMS UI**
- [ ] CMS pages management (`app/admin/cms/pages/page.tsx`)
- [ ] Page editor with rich text editor (Tiptap or similar)
- [ ] Homepage content editor (`app/admin/cms/homepage/page.tsx`)
- [ ] Homepage section builder (drag-and-drop sections)
- [ ] FAQ management page (`app/admin/cms/faq/page.tsx`)
- [ ] Terms & Privacy editor
- [ ] Page preview functionality
- [ ] SEO metadata editor for pages

**2.2 Theme Customization UI**
- [ ] Theme customization page (`app/admin/settings/theme/page.tsx`)
- [ ] Color picker for theme colors
- [ ] Font selector
- [ ] Logo upload component
- [ ] Favicon upload
- [ ] Theme preview (live preview before saving)
- [ ] Theme reset functionality
- [ ] Footer customization interface
- [ ] Banner management (hero banners, promotional banners)

**2.3 Public CMS Pages**
- [ ] Dynamic page rendering (`app/(store)/pages/[slug]/page.tsx`)
- [ ] Homepage with CMS content
- [ ] FAQ page with CMS FAQs
- [ ] Terms & Conditions page
- [ ] Privacy Policy page
- [ ] SEO optimization for CMS pages

### Full-Stack Tasks (Step 3)

**3.1 Theme Application**
- [ ] CSS variable system for theme colors
- [ ] Dynamic theme loading (inject theme settings into page)
- [ ] Theme caching (Redis, 1hr TTL)
- [ ] Fallback theme (default if no custom theme)

**3.2 Homepage Builder**
- [ ] Homepage section components (Hero, Featured Products, Banners, etc.)
- [ ] Section configuration interface
- [ ] Dynamic homepage rendering based on CMS content
- [ ] Section preview functionality

**3.3 Content Publishing**
- [ ] Page status workflow (draft, published)
- [ ] Scheduled publishing (optional)
- [ ] Content versioning (optional, future enhancement)

### Deliverables & Acceptance Criteria
- ✅ Admin can create and manage CMS pages
- ✅ Homepage content editable through admin panel
- ✅ FAQ management functional
- ✅ Theme customization working with live preview
- ✅ Logo and favicon can be uploaded
- ✅ CMS pages render correctly on frontend
- ✅ SEO metadata applied to CMS pages
- ✅ All tests passing

---

## Phase 12: Optimizations & Reliability ⚡
**Timeline**: Weeks 31-33  
**Objectives**: Performance optimization and monitoring  
**Milestone**: Optimized application with monitoring in place  
**Effort**: 50 person-days (25 BE / 25 FE)  
**Risks**: Cache invalidation complexity (mitigate with hooks)

### Sync Requirements
- All APIs for caching
- All pages for SEO optimization

### Backend Tasks (Step 1)

**1.1 Redis Caching**
- [ ] Cache layer for frequently accessed data:
  - Product listings (1hr TTL)
  - Category tree (6hr TTL)
  - User profile (30min TTL)
- [ ] Cache invalidation hooks (on product update, category change)
- [ ] Cache middleware for GET endpoints
- [ ] Cache warming strategies

**1.2 Backup & Maintenance**
- [ ] MongoDB backup cron job (daily)
- [ ] Backup verification script
- [ ] Database cleanup jobs (old logs, expired sessions)

### Frontend Tasks (Step 2)

**2.1 Performance Optimization**
- [ ] Image optimization: Next.js `<Image>` component with WebP
- [ ] Lazy loading for product images, components
- [ ] Code splitting (dynamic imports)
- [ ] Bundle analysis and optimization
- [ ] PWA features (service worker, manifest)

**2.2 i18n Completion**
- [ ] Complete all translation files
- [ ] Currency conversion in all price displays
- [ ] Date/time localization
- [ ] RTL support (if needed)

### Full-Stack Tasks (Step 3)

**3.1 Sentry Integration**
- [ ] Install `@sentry/nextjs`
- [ ] Sentry configuration (frontend and backend)
- [ ] Error boundary components
- [ ] Performance monitoring
- [ ] Admin dashboard integration for error logs

**3.2 Integration Settings**
- [ ] Admin settings page for API keys (Razorpay, reCAPTCHA, etc.)
- [ ] Secure storage of keys (environment variables, encrypted DB)
- [ ] Settings update endpoints
- [ ] Test connection functionality

### Deliverables & Acceptance Criteria
- ✅ Redis caching reduces database load
- ✅ Cache invalidation works correctly
- ✅ Images optimized and lazy-loaded
- ✅ Lighthouse score >90 for performance
- ✅ Sentry captures and reports errors
- ✅ All pages i18n enabled
- ✅ All tests passing

---

## Phase 13: Testing, Deployment & Maintenance 🚀
**Timeline**: Weeks 20+  
**Objectives**: Production-ready deployment  
**Milestone**: Live production application  
**Effort**: 50+ person-days (ongoing)  
**Risks**: Downtime (mitigate with rollback strategy)

### Sync Requirements
- Full application for E2E testing

### Full-Stack Tasks (Step 1)

**1.1 Code Polish**
- [ ] Accessibility audit (WCAG 2.1 Level AA compliance)
- [ ] Fix all accessibility issues (ARIA labels, keyboard nav, contrast)
- [ ] Code cleanup (remove console.logs, optimize imports)
- [ ] Health check endpoints (frontend and backend)
- [ ] API documentation (Swagger/OpenAPI)

**1.2 Testing**
- [ ] Increase test coverage to 80%+
- [ ] Cypress E2E tests for critical flows:
  - User registration → login → browse → cart → checkout
  - Admin product management
  - Order processing
- [ ] Load testing (JMeter or k6)
- [ ] Security testing (OWASP checklist)

### Deployment Tasks (Step 2)

**2.1 Dockerization**
- [ ] Dockerfile for backend
- [ ] Dockerfile for frontend
- [ ] docker-compose.yml for local development
- [ ] docker-compose.prod.yml for production
- [ ] Multi-stage builds for optimization

**2.2 Deployment Setup**
- [ ] Frontend: Vercel deployment configuration
- [ ] Backend: AWS EC2/ECS or similar
- [ ] Environment variables setup (production)
- [ ] Database: MongoDB Atlas production cluster
- [ ] Redis: AWS ElastiCache or similar
- [ ] Elasticsearch: AWS OpenSearch or managed service

**2.3 CI/CD**
- [ ] GitHub Actions workflow:
  - Lint and test on PR
  - Build Docker images
  - Deploy to staging on merge to develop
  - Deploy to production on merge to main
- [ ] Rollback scripts

### Monitoring Tasks (Step 3)

**3.1 Production Monitoring**
- [ ] Sentry production setup
- [ ] Uptime monitoring (UptimeRobot or similar)
- [ ] Database monitoring (MongoDB Atlas metrics)
- [ ] Server monitoring (CPU, memory, disk)
- [ ] Log aggregation (CloudWatch or similar)

**3.2 Documentation**
- [ ] README.md with setup instructions
- [ ] API documentation
- [ ] Deployment guide
- [ ] Runbooks for common issues
- [ ] Backup/restore procedures

### Post-Launch Tasks (Step 4)

**4.1 Maintenance**
- [ ] Hotfix process
- [ ] Feature iteration planning
- [ ] User feedback collection
- [ ] Performance monitoring and optimization
- [ ] Security updates

### Deliverables & Acceptance Criteria
- ✅ Application deployed to production
- ✅ All E2E tests passing
- ✅ Test coverage >80%
- ✅ CI/CD pipeline working
- ✅ Monitoring and alerts configured
- ✅ Documentation complete
- ✅ Application accessible and performant
- ✅ Security audit passed

---

## 📊 Phase Summary

| Phase | Timeline | Focus | Milestone | Effort (days) |
|-------|----------|-------|-----------|---------------|
| 1 | Weeks 1-2 | Auth & Security | E2E Login | 40 |
| 2 | Weeks 3-4 | Profile & Notifications | Profile Updates | 50 |
| 3 | Weeks 5-7 | Product Catalog | Searchable Catalog | 60 |
| 4 | Weeks 8-10 | Cart & Wishlist | Cart Persistence | 60 |
| 5 | Weeks 11-13 | Checkout & Payments | E2E Order | 70 |
| 6 | Weeks 14-16 | Admin & Loyalty | Permission Dashboard | 60 |
| 7 | Weeks 17-18 | Email Notifications | Notification System | 40 |
| 8 | Weeks 19-21 | Product Enhancements | Reviews & Recommendations | 50 |
| 9 | Weeks 22-24 | Advanced Admin | Analytics & Inventory | 60 |
| 10 | Weeks 25-27 | Business Features | Gift Cards & Pricing | 55 |
| 11 | Weeks 28-30 | CMS & Customization | Content Management | 50 |
| 12 | Weeks 31-33 | Optimizations | Optimized Beta | 50 |
| 13 | Weeks 34+ | Deployment | Live Production | 50+ |

**Total Effort**: ~685+ person-days

---

## 🎯 Quick Reference Commands

### Development
```bash
# Start all services (MongoDB, Redis, Elasticsearch)
docker-compose up -d

# Backend dev server
cd server && npm run dev

# Frontend dev server
cd app && npm run dev

# Run tests
npm test                    # Backend
npm run test:e2e           # Cypress
```

### Git Workflow
```bash
# Start new phase
git checkout -b phase-1-setup
git commit -m "feat: [feature description]"
git push origin phase-1-setup

# Merge phase
git checkout main
git merge phase-1-setup
```

---

## 📝 Notes for AI Development

- **Always reference `.cursorrules`** for coding standards
- **Break tasks into atomic commits** (one feature per commit)
- **Test as you build** (write tests alongside code)
- **Follow the file structure template** above
- **Keep files under 1000 lines** (split if needed)
- **Use Shadcn UI components** consistently
- **Mobile-first responsive design** for all UI
- **SSR for all public pages** (products, categories)
- **RBAC checks on every protected route**
- **Environment variables** for all secrets
- **Error handling** in all API endpoints
- **Logging** for debugging and monitoring

---

**Current Status**: Phase 9 (Advanced Admin Features & Analytics) Complete  
**Next Action**: Begin Phase 10 (Business Features & Marketing Tools)
