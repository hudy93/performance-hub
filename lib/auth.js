import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import PostgresAdapter from '@auth/pg-adapter';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Attach user.id to the session so API routes can use it
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
