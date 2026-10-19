# E-Commerce Platform

Modern e-commerce platform built with Next.js 15, Express.js, MongoDB, Redis, and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- MongoDB Atlas account (optional, can use local Docker)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecom
```

2. **Start Docker services (MongoDB, Redis)**
```bash
docker-compose up -d
```

3. **Backend Setup**
```bash
cd server
npm install
cp ../env.example .env
# Edit .env with your configuration
npm run dev
```

4. **Frontend Setup**
```bash
cd app
npm install
cp ../env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

5. **Seed Superadmin User**
```bash
cd server
npm run seed:superadmin
```

## 📁 Project Structure

```
ecom/
├── server/              # Backend (Express.js + TypeScript)
│   ├── src/
│   │   ├── config/      # Database, Redis configs
│   │   ├── middleware/  # Auth, RBAC, validation
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Business logic
│   │   ├── services/    # External services
│   │   ├── utils/       # Helpers
│   │   └── server.ts    # Express app entry
│   └── tests/           # Jest tests
├── app/                 # Frontend (Next.js 15)
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utilities, hooks, API clients
│   └── styles/          # Global styles
└── docker-compose.yml   # Docker services config
```

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
npm run test:coverage
```

### Frontend E2E Tests
```bash
cd app
npm run cypress:open  # Interactive mode
npm run test:e2e      # Headless mode
```

## 📝 Environment Variables

See `env.example` for all required environment variables. Key variables:

- `JWT_SECRET`: Secret key for JWT tokens
- `MONGODB_URI`: MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_SITE_KEY`: Google reCAPTCHA keys
- `NEXTAUTH_SECRET`: NextAuth.js secret

## 🔐 Authentication

- JWT-based authentication with access tokens (15min) and refresh tokens (7 days)
- MFA (Multi-Factor Authentication) for Admin/Superadmin roles
- Google reCAPTCHA v3 on login/registration
- Role-based access control (RBAC): User, Admin, Superadmin

## 🛠️ Development

### Backend
```bash
cd server
npm run dev        # Development server with hot reload
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Frontend
```bash
cd app
npm run dev        # Development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## 📋 Current Phase

**Phase 1: Setup, Auth & Security** ✅ Completed
- ✅ Backend scaffold with Express.js + TypeScript
- ✅ Database setup (MongoDB, Redis)
- ✅ Security middleware (Helmet, CORS, rate limiting)
- ✅ JWT & RBAC infrastructure
- ✅ User authentication (login, register, logout)
- ✅ MFA implementation
- ✅ CAPTCHA integration
- ✅ Frontend with Next.js 15 + Tailwind CSS + Shadcn UI
- ✅ NextAuth.js integration
- ✅ Testing infrastructure

## 🎯 Next Steps

See `PLAN.md` for the complete development roadmap.

**Phase 2**: Profile, Privacy & Notifications
- User profile management
- GDPR compliance
- Socket.io real-time notifications
- i18n setup

## 📄 License

ISC

## 🤝 Contributing

See contributing guidelines for more information.

