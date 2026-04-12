import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getCompetencies } from '@/lib/db';

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const competencies = await getCompetencies(user.id);
  return NextResponse.json(competencies);
}
