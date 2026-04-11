import { NextResponse } from 'next/server';
import { getRoles, saveRoles } from '@/lib/data';

export async function GET() {
  const roles = await getRoles();
  return NextResponse.json(roles);
}

export async function POST(request) {
  const body = await request.json();
  const roles = await getRoles();

  const maxId = roles.reduce((max, r) => Math.max(max, r.id), 0);
  const newRole = { ...body, id: maxId + 1 };

  roles.push(newRole);
  await saveRoles(roles);

  return NextResponse.json(newRole, { status: 201 });
}
