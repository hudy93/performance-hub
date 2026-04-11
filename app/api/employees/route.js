import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees } from '@/lib/data';

export async function GET() {
  const employees = await getEmployees();
  return NextResponse.json(employees);
}

export async function POST(request) {
  const body = await request.json();
  const employees = await getEmployees();

  const maxId = employees.reduce((max, e) => Math.max(max, e.id), 0);
  const newEmployee = { ...body, id: maxId + 1 };

  employees.push(newEmployee);
  await saveEmployees(employees);

  return NextResponse.json(newEmployee, { status: 201 });
}
