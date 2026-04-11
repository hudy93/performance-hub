import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees } from '@/lib/data';

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const employees = await getEmployees();

  const index = employees.findIndex((e) => e.id === parseInt(id));
  if (index === -1) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  employees[index] = { ...body, id: parseInt(id) };
  await saveEmployees(employees);

  return NextResponse.json(employees[index]);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const employees = await getEmployees();

  const filtered = employees.filter((e) => e.id !== parseInt(id));
  if (filtered.length === employees.length) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  await saveEmployees(filtered);
  return NextResponse.json({ success: true });
}
