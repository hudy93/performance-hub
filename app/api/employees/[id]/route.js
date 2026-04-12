import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { updateEmployee, deleteEmployee } from '@/lib/db';

export async function PUT(request, { params }) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const updated = await updateEmployee(user.id, parseInt(id), body);
  if (!updated) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;
  const deleted = await deleteEmployee(user.id, parseInt(id));
  if (!deleted) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
