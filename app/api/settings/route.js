import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api-auth';
import { getSettings, saveSettings } from '@/lib/db';

const settingsSchema = z.object({
  budget: z.number().int().min(0).max(100000000).optional().default(15000),
  githubOrg: z.string().max(100).optional().default(''),
  inflation: z.number().min(0).max(100).optional().default(3.2),
});

export async function GET() {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const settings = await getSettings(user.id);
    return NextResponse.json(settings);
  } catch (err) {
    console.error('GET /api/settings failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const body = await request.json();
    const result = settingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    await saveSettings(user.id, result.data);
    return NextResponse.json(result.data);
  } catch (err) {
    console.error('PUT /api/settings failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
