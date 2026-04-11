import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/data';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const body = await request.json();
  await saveSettings(body);
  return NextResponse.json(body);
}
