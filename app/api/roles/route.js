import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getRoles, createRole } from '@/lib/db';

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const roles = await getRoles(user.id);
  return NextResponse.json(roles);
}

export async function POST(request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  const newRole = await createRole(user.id, body);
  return NextResponse.json(newRole, { status: 201 });
}
