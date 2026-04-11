import { NextResponse } from 'next/server';
import { getRoles, saveRoles } from '@/lib/data';

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const roles = await getRoles();

  const index = roles.findIndex((r) => r.id === parseInt(id));
  if (index === -1) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  roles[index] = { ...body, id: parseInt(id) };
  await saveRoles(roles);

  return NextResponse.json(roles[index]);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const roles = await getRoles();

  const filtered = roles.filter((r) => r.id !== parseInt(id));
  if (filtered.length === roles.length) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  await saveRoles(filtered);
  return NextResponse.json({ success: true });
}
