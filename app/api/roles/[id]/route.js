import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { updateRole, deleteRole } from '@/lib/db';

export async function PUT(request, { params }) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const updated = await updateRole(user.id, parseInt(id), body);
  if (!updated) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;
  const deleted = await deleteRole(user.id, parseInt(id));
  if (!deleted) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
