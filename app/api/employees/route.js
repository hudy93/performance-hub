import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getEmployees, createEmployee } from '@/lib/db';

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const employees = await getEmployees(user.id);
  return NextResponse.json(employees);
}

export async function POST(request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  const newEmployee = await createEmployee(user.id, body);
  return NextResponse.json(newEmployee, { status: 201 });
}
