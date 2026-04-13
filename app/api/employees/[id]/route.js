import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api-auth';
import { updateEmployee, deleteEmployee } from '@/lib/db';

const milestoneSchema = z.object({
  title: z.string().min(1).max(500),
  status: z.string().max(50).optional().default('pending'),
  dueDate: z.string().max(20).optional().nullable(),
});

const competencyAssessmentSchema = z.object({
  competencyId: z.number().int(),
  met: z.boolean().optional().default(false),
  isTarget: z.boolean().optional().default(false),
  milestones: z.array(milestoneSchema).max(20).optional().default([]),
});

const personalGoalSchema = z.object({
  title: z.string().min(1).max(500),
  why: z.string().max(2000).optional().default(''),
  specific: z.string().max(2000).optional().default(''),
  measurable: z.string().max(2000).optional().default(''),
  achievable: z.string().max(2000).optional().default(''),
  relevant: z.string().max(2000).optional().default(''),
  timeBound: z.string().max(500).optional().default(''),
  progress: z.number().int().min(0).max(100).optional().default(0),
  weight: z.number().int().min(0).max(100).optional().default(20),
  status: z.string().max(50).optional().default('not-started'),
});

const teamGoalSchema = z.object({
  title: z.string().min(1).max(500),
  measurable: z.string().max(2000).optional().default(''),
  deadline: z.string().max(20).optional().nullable(),
  progress: z.number().int().min(0).max(100).optional().default(0),
  contribution: z.string().max(50).optional().default('medium'),
});

const extraSchema = z.object({
  text: z.string().min(1).max(2000),
  category: z.string().max(50).optional().default('initiative'),
  date: z.string().max(20).optional().default(''),
});

const updateEmployeeSchema = z.object({
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
  githubData: z.any().optional().nullable(),
  lastReview: z.union([z.string().max(20), z.date()]).optional().nullable().transform(v => v instanceof Date ? v.toISOString().split('T')[0] : v),
  personalGoals: z.array(personalGoalSchema).max(50).optional().default([]),
  teamGoals: z.array(teamGoalSchema).max(50).optional().default([]),
  extras: z.array(extraSchema).max(100).optional().default([]),
  competencyAssessments: z.array(competencyAssessmentSchema).max(100).optional().default([]),
});

export async function PUT(request, { params }) {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const { id } = await params;
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();
    const result = updateEmployeeSchema.safeParse(body);
    if (!result.success) {
      console.error('Validation failed:', JSON.stringify(result.error.issues, null, 2));
      return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
    }

    const updated = await updateEmployee(user.id, employeeId, result.data);
    if (!updated) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/employees/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await getAuthUser();
    if (error) return error;

    const { id } = await params;
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const deleted = await deleteEmployee(user.id, employeeId);
    if (!deleted) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/employees/[id] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
