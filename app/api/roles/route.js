import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api-auth';
import { getRoles, createRole } from '@/lib/db';

const createRoleSchema = z.object({
  name: z.string().min(1).max(200),
  department: z.string().max(200).optional().default(''),
  salaryBand: z.object({
    min: z.number().int().min(0).max(10000000).optional().default(0),
    mid: z.number().int().min(0).max(10000000).optional().default(0),
    max: z.number().int().min(0).max(10000000).optional().default(0),
  }).optional().default({}),
  marketRate: z.number().int().min(0).max(10000000).optional().default(0),
});

export async function GET() {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const roles = await getRoles(user.id);
    return NextResponse.json(roles);
  } catch (err) {
    console.error('GET /api/roles failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const body = await request.json();
    const result = createRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const newRole = await createRole(user.id, result.data);
    return NextResponse.json(newRole, { status: 201 });
  } catch (err) {
    console.error('POST /api/roles failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
