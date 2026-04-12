import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api-auth';
import { updateRole, deleteRole } from '@/lib/db';

const updateRoleSchema = z.object({
  name: z.string().min(1).max(200),
  department: z.string().max(200).optional().default(''),
  salaryBand: z.object({
    min: z.number().int().min(0).max(10000000).optional().default(0),
    mid: z.number().int().min(0).max(10000000).optional().default(0),
    max: z.number().int().min(0).max(10000000).optional().default(0),
  }).optional().default({}),
  marketRate: z.number().int().min(0).max(10000000).optional().default(0),
});

export async function PUT(request, { params }) {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const body = await request.json();
    const result = updateRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const updated = await updateRole(user.id, roleId, result.data);
    if (!updated) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/roles/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const deleted = await deleteRole(user.id, roleId);
    if (!deleted) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/roles/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
