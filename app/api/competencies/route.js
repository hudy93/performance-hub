import { NextResponse } from 'next/server';
import { getCompetencies } from '@/lib/data';

export async function GET() {
  const competencies = await getCompetencies();
  return NextResponse.json(competencies);
}
