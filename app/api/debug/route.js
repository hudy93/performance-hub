import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function GET() {
  const envCheck = {
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasGithubId: !!process.env.AUTH_GITHUB_ID,
    hasGithubSecret: !!process.env.AUTH_GITHUB_SECRET,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    nodeEnv: process.env.NODE_ENV,
  };

  // Test DB connection
  let dbCheck = {};
  try {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM users');
    const { rows: tables } = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    dbCheck = {
      connected: true,
      userCount: rows[0].count,
      tables: tables.map(t => t.table_name),
    };
    await pool.end();
  } catch (err) {
    dbCheck = { connected: false, error: err.message };
  }

  return NextResponse.json({ ...envCheck, db: dbCheck });
}
