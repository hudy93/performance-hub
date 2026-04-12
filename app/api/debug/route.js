import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import PostgresAdapter from '@auth/pg-adapter';

export async function GET() {
  const results = {};

  // Test DB connection
  try {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

    // Test basic query
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM users');
    results.userCount = rows[0].count;

    // Test the actual adapter
    const adapter = PostgresAdapter(pool);
    const user = await adapter.getUserByEmail?.('test-debug@nonexistent.com');
    results.adapterWorks = true;
    results.testUserFound = !!user;

    // Check existing user
    const { rows: users } = await pool.query('SELECT id, name, email FROM users LIMIT 1');
    results.existingUser = users[0] || null;

    // Check accounts table
    const { rows: accounts } = await pool.query('SELECT "userId", provider, "providerAccountId" FROM accounts LIMIT 1');
    results.existingAccount = accounts[0] || null;

    await pool.end();
  } catch (err) {
    results.error = err.message;
    results.stack = err.stack?.split('\n').slice(0, 5);
  }

  // Check NextAuth config
  try {
    const { auth } = await import('@/lib/auth');
    results.authModuleLoads = true;
  } catch (err) {
    results.authModuleError = err.message;
  }

  return NextResponse.json(results);
}
