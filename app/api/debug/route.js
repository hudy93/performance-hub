import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasGithubId: !!process.env.AUTH_GITHUB_ID,
    hasGithubSecret: !!process.env.AUTH_GITHUB_SECRET,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 30) + '...',
    nodeEnv: process.env.NODE_ENV,
  });
}
