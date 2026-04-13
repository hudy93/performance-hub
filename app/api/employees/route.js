import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api-auth';
import { getEmployees, createEmployee } from '@/lib/db';

const createEmployeeSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200).optional().default(''),
  department: z.string().max(200).optional().default(''),
  avatar: z.string().max(500).optional().default(''),
  currentSalary: z.number().int().min(0).max(10000000).optional().default(0),
  salaryBand: z.object({
    min: z.number().int().min(0).max(10000000).optional().default(0),
    mid: z.number().int().min(0).max(10000000).optional().default(0),
    max: z.number().int().min(0).max(10000000).optional().default(0),
  }).optional().default({}),
  marketRate: z.number().int().min(0).max(10000000).optional().default(0),
  performanceScore: z.number().min(0).max(5).optional().default(3.0),
  highlights: z.array(z.string().max(500)).max(20).optional().default([]),
  githubUsername: z.string().max(100).optional().default(''),
  lastReview: z.string().max(20).optional().nullable(),
});

export async function GET() {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const employees = await getEmployees(user.id);
    return NextResponse.json(employees);
  } catch (err) {
    console.error('GET /api/employees failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const body = await request.json();
    const result = createEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const newEmployee = await createEmployee(user.id, result.data);
    return NextResponse.json(newEmployee, { status: 201 });
  } catch (err) {
    console.error('POST /api/employees failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
