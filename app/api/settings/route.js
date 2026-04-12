import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getSettings, saveSettings } from '@/lib/db';

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const settings = await getSettings(user.id);
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  await saveSettings(user.id, body);
  return NextResponse.json(body);
}
