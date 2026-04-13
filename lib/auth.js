import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: 'jwt' },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email read:org',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_USERS;
      if (!allowed) return true;
      const list = allowed.split(',').map(u => u.trim().toLowerCase());
      const login = (profile?.login || '').toLowerCase();
      const email = (profile?.email || '').toLowerCase();
      return list.includes(login) || list.includes(email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      return session;
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV !== 'production',
  logger: {
    error: (code, ...message) => {
      console.error('[auth][error]', code, ...message);
    },
    warn: (code) => {
      console.warn('[auth][warn]', code);
    },
  },
});
