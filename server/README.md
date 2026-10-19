# E-Commerce Backend Server

Express.js backend server with TypeScript for the e-commerce platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp ../env.example .env
```

3. Update `.env` with your configuration values.

4. Start Docker services (MongoDB, Redis):
```bash
docker compose up -d
```

5. Run development server:
```bash
npm run dev
```

The server will automatically restart when you make changes to files in the `src` directory.

## Scripts

- `npm run dev` - Start development server with nodemon (auto-restart on file changes)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run seed:superadmin` - Create initial superadmin user

## Development

The server uses **nodemon** for development, which automatically restarts when you save files.

### Nodemon Configuration

- Watches: `src/` directory
- Extensions: `.ts`, `.json`
- Ignores: test files, `node_modules`, `dist`
- Uses: `ts-node` for TypeScript execution

## Environment Variables

See `../env.example` for all required environment variables.

Key variables:
- `JWT_SECRET` - Secret key for JWT tokens
- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `FRONTEND_URL` - Frontend URL for CORS

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify MFA token
- `POST /api/auth/mfa/disable` - Disable MFA

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage  # Coverage report
```
