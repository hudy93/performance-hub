import { NextResponse } from 'next/server';

export async function GET(request) {
  const error = request.nextUrl.searchParams.get('error');
  return NextResponse.json({
    authError: error,
    hint: error === 'Configuration'
      ? 'Check AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, and POSTGRES_URL env vars. Also verify the GitHub OAuth callback URL matches: ' + request.nextUrl.origin + '/api/auth/callback/github'
      : 'Unknown auth error',
    expectedCallback: request.nextUrl.origin + '/api/auth/callback/github',
  });
}
