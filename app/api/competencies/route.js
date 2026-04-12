import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getCompetencies } from '@/lib/db';

export async function GET() {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const competencies = await getCompetencies(user.id);
    return NextResponse.json(competencies);
  } catch (err) {
    console.error('GET /api/competencies failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
