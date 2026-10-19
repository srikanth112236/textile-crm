import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Backend sets refreshToken as HttpOnly cookie. Browser→backend calls receive
// it directly, but authorize() runs server-side, so the Set-Cookie would die
// here — extract it and carry it in the NextAuth JWT instead.
function extractRefreshToken(setCookie: unknown): string | undefined {
  const header = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie || '');
  const m = header.match(/refreshToken=([^;]+)/);
  try {
    return m?.[1] ? decodeURIComponent(m[1]) : undefined;
  } catch {
    return m?.[1];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          const { user, accessToken } = response.data;
          return { id: user.id, email: user.email, role: user.role, accessToken, refreshToken: extractRefreshToken(response.headers?.['set-cookie']) };
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Login failed');
        }
      },
    }),
    CredentialsProvider({
      id: 'otp',
      name: 'Mobile OTP',
      credentials: {
        phone: { label: 'Mobile', type: 'text' },
        code: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          throw new Error('Mobile number and OTP are required');
        }
        try {
          const response = await axios.post(`${API_URL}/api/auth/otp/verify`, {
            phone: credentials.phone,
            code: credentials.code,
          });
          const { user, accessToken } = response.data;
          return { id: user.id, email: user.email, role: user.role, accessToken, refreshToken: extractRefreshToken(response.headers?.['set-cookie']) };
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'OTP verification failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.id = user.id;
        if ((user as any).refreshToken) token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session as any).accessToken = token.accessToken;
        if ((token as any).refreshToken) (session as any).refreshToken = (token as any).refreshToken;
      }
      return session;
    },
  },
  pages: { signIn: '/login', signOut: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-change-in-production',
};
