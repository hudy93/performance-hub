# Multi-User Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GitHub OAuth authentication with Vercel Postgres so each user gets an isolated workspace with their own employees, goals, and settings.

**Architecture:** NextAuth.js v5 handles GitHub OAuth, storing sessions and accounts in Vercel Postgres. A new `lib/db.js` replaces the JSON file layer (`lib/data.js`), with all queries scoped by `userId`. The app moves from `/` to `/dashboard` (protected), with a public landing page at `/`.

**Tech Stack:** NextAuth.js v5 (Auth.js), `@auth/pg-adapter`, `@vercel/postgres`, Next.js 15 middleware

---

## File Structure

```
lib/
  auth.js          — NextAuth configuration (GitHub provider, Postgres adapter, callbacks)
  db.js            — Postgres query layer (replaces data.js)

app/
  layout.js        — Add SessionProvider wrapper
  page.js          — Landing page (public)
  dashboard/
    page.js        — Protected dashboard (renders App component)
  api/
    auth/
      [...nextauth]/
        route.js   — NextAuth API handlers
    employees/
      route.js     — Add auth check, use db.js
      [id]/
        route.js   — Add auth check, use db.js
        github-sync/
          route.js — Use token from session
    roles/
      route.js     — Add auth check, use db.js
      [id]/
        route.js   — Add auth check, use db.js
    settings/
      route.js     — Add auth check, use db.js
    competencies/
      route.js     — Add auth check, merge user overrides

components/
  App.jsx          — Add user prop, logout button, avatar
  SessionWrapper.jsx — Client component wrapping SessionProvider

middleware.js      — Redirect unauthenticated users from /dashboard

scripts/
  migrate.js       — Database schema creation + seed global competencies
```

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install auth and database packages**

```bash
npm install next-auth@beta @auth/pg-adapter @vercel/postgres
```

- [ ] **Step 2: Verify installation**

```bash
node -e "import('next-auth').then(() => console.log('next-auth OK')); import('@vercel/postgres').then(() => console.log('@vercel/postgres OK'))"
```

Expected: both print OK.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add next-auth, @auth/pg-adapter, @vercel/postgres"
```

---

### Task 2: Database migration script

**Files:**
- Create: `scripts/migrate.js`

This script creates all tables and seeds the global competency catalog.

- [ ] **Step 1: Create `scripts/migrate.js`**

```javascript
import { sql } from '@vercel/postgres';
import { readFile } from 'fs/promises';
import path from 'path';

async function migrate() {
  console.log('Creating tables...');

  // NextAuth required tables
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      email TEXT UNIQUE,
      "emailVerified" TIMESTAMPTZ,
      image TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at BIGINT,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, "providerAccountId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMPTZ NOT NULL,
      UNIQUE(identifier, token)
    )
  `;

  // App tables
  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      department TEXT,
      avatar TEXT,
      current_salary INTEGER DEFAULT 0,
      salary_band_min INTEGER DEFAULT 0,
      salary_band_mid INTEGER DEFAULT 0,
      salary_band_max INTEGER DEFAULT 0,
      market_rate INTEGER DEFAULT 0,
      inflation NUMERIC DEFAULT 3.2,
      performance_score NUMERIC DEFAULT 3.0,
      highlights JSONB DEFAULT '[]',
      github_username TEXT DEFAULT '',
      github_data JSONB,
      last_review DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS personal_goals (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      why TEXT DEFAULT '',
      specific TEXT DEFAULT '',
      measurable TEXT DEFAULT '',
      achievable TEXT DEFAULT '',
      relevant TEXT DEFAULT '',
      time_bound TEXT DEFAULT '',
      progress INTEGER DEFAULT 0,
      weight INTEGER DEFAULT 20,
      status TEXT DEFAULT 'not-started'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS team_goals (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      measurable TEXT DEFAULT '',
      deadline DATE,
      progress INTEGER DEFAULT 0,
      contribution TEXT DEFAULT 'medium'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS extras (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      category TEXT DEFAULT 'initiative',
      date TEXT DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS competency_assessments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      competency_id INTEGER NOT NULL,
      met BOOLEAN DEFAULT FALSE,
      is_target BOOLEAN DEFAULT FALSE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS milestones (
      id SERIAL PRIMARY KEY,
      assessment_id INTEGER NOT NULL REFERENCES competency_assessments(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      due_date DATE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      department TEXT DEFAULT '',
      salary_band_min INTEGER DEFAULT 0,
      salary_band_mid INTEGER DEFAULT 0,
      salary_band_max INTEGER DEFAULT 0,
      market_rate INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      budget INTEGER DEFAULT 15000,
      github_org TEXT DEFAULT 'collaborationFactory'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_competencies (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tag TEXT NOT NULL,
      expectations JSONB NOT NULL
    )
  `;

  // Seed global competencies table (read-only defaults)
  await sql`
    CREATE TABLE IF NOT EXISTS global_competencies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tag TEXT NOT NULL,
      expectations JSONB NOT NULL
    )
  `;

  // Check if already seeded
  const { rows } = await sql`SELECT COUNT(*) as count FROM global_competencies`;
  if (parseInt(rows[0].count) === 0) {
    console.log('Seeding global competencies...');
    const filePath = path.join(process.cwd(), 'data', 'competencies.json');
    const raw = await readFile(filePath, 'utf-8');
    const competencies = JSON.parse(raw);

    for (const comp of competencies) {
      await sql`
        INSERT INTO global_competencies (id, name, category, tag, expectations)
        VALUES (${comp.id}, ${comp.name}, ${comp.category}, ${comp.tag}, ${JSON.stringify(comp.expectations)})
      `;
    }
    console.log(`Seeded ${competencies.length} competencies.`);
  }

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_personal_goals_employee_id ON personal_goals(employee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_team_goals_employee_id ON team_goals(employee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_extras_employee_id ON extras(employee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_competency_assessments_employee_id ON competency_assessments(employee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_milestones_assessment_id ON milestones(assessment_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_roles_user_id ON roles(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_competencies_user_id ON user_competencies(user_id)`;

  console.log('Migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add migrate script to package.json**

Add to the `"scripts"` section:

```json
"migrate": "node scripts/migrate.js"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate.js package.json
git commit -m "feat: add database migration script with schema and competency seed"
```

---

### Task 3: NextAuth configuration

**Files:**
- Create: `lib/auth.js`
- Create: `app/api/auth/[...nextauth]/route.js`

- [ ] **Step 1: Create `lib/auth.js`**

```javascript
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from '@vercel/postgres';

const pool = new Pool();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Attach user.id to the session so API routes can use it
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
```

- [ ] **Step 2: Create `app/api/auth/[...nextauth]/route.js`**

```javascript
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Commit**

```bash
git add lib/auth.js "app/api/auth/[...nextauth]/route.js"
git commit -m "feat: add NextAuth config with GitHub provider and Postgres adapter"
```

---

### Task 4: Auth middleware

**Files:**
- Create: `middleware.js`

- [ ] **Step 1: Create `middleware.js` at project root**

```javascript
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/api/employees/:path*', '/api/roles/:path*', '/api/settings/:path*', '/api/competencies/:path*'],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.js
git commit -m "feat: add auth middleware protecting dashboard and API routes"
```

---

### Task 5: Database query layer

**Files:**
- Create: `lib/db.js`

This replaces `lib/data.js`. All functions take `userId` as first parameter.

- [ ] **Step 1: Create `lib/db.js`**

```javascript
import { sql } from '@vercel/postgres';

// ── Helpers ──

function rowToEmployee(row, personalGoals, teamGoals, extras, assessments) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    avatar: row.avatar,
    currentSalary: row.current_salary,
    salaryBand: { min: row.salary_band_min, mid: row.salary_band_mid, max: row.salary_band_max },
    marketRate: row.market_rate,
    inflation: parseFloat(row.inflation),
    performanceScore: parseFloat(row.performance_score),
    highlights: row.highlights || [],
    githubUsername: row.github_username || '',
    githubData: row.github_data || null,
    lastReview: row.last_review,
    personalGoals: personalGoals || [],
    teamGoals: teamGoals || [],
    extras: extras || [],
    competencyAssessments: assessments || [],
  };
}

// ── Employees ──

export async function getEmployees(userId) {
  const { rows: empRows } = await sql`
    SELECT * FROM employees WHERE user_id = ${userId} ORDER BY id
  `;

  const employees = [];
  for (const row of empRows) {
    const { rows: goals } = await sql`
      SELECT * FROM personal_goals WHERE employee_id = ${row.id} ORDER BY id
    `;
    const { rows: tGoals } = await sql`
      SELECT * FROM team_goals WHERE employee_id = ${row.id} ORDER BY id
    `;
    const { rows: exRows } = await sql`
      SELECT * FROM extras WHERE employee_id = ${row.id} ORDER BY id
    `;
    const { rows: caRows } = await sql`
      SELECT * FROM competency_assessments WHERE employee_id = ${row.id} ORDER BY id
    `;

    // Load milestones for each assessment
    const assessments = [];
    for (const ca of caRows) {
      const { rows: msRows } = await sql`
        SELECT * FROM milestones WHERE assessment_id = ${ca.id} ORDER BY id
      `;
      assessments.push({
        competencyId: ca.competency_id,
        met: ca.met,
        isTarget: ca.is_target,
        milestones: msRows.map(m => ({
          id: m.id,
          title: m.title,
          status: m.status,
          dueDate: m.due_date,
        })),
      });
    }

    const personalGoals = goals.map(g => ({
      id: g.id,
      title: g.title,
      why: g.why || '',
      specific: g.specific || '',
      measurable: g.measurable || '',
      achievable: g.achievable || '',
      relevant: g.relevant || '',
      timeBound: g.time_bound || '',
      progress: g.progress,
      weight: g.weight,
      status: g.status,
    }));

    const teamGoals = tGoals.map(g => ({
      id: g.id,
      title: g.title,
      measurable: g.measurable || '',
      deadline: g.deadline,
      progress: g.progress,
      contribution: g.contribution,
    }));

    const extras = exRows.map(e => ({
      id: e.id,
      text: e.text,
      category: e.category,
      date: e.date,
    }));

    employees.push(rowToEmployee(row, personalGoals, teamGoals, extras, assessments));
  }

  return employees;
}

export async function getEmployee(userId, employeeId) {
  const employees = await getEmployees(userId);
  return employees.find(e => e.id === employeeId) || null;
}

export async function createEmployee(userId, data) {
  const { rows } = await sql`
    INSERT INTO employees (user_id, name, role, department, avatar, current_salary,
      salary_band_min, salary_band_mid, salary_band_max, market_rate, inflation,
      performance_score, highlights, github_username, last_review)
    VALUES (${userId}, ${data.name}, ${data.role}, ${data.department}, ${data.avatar},
      ${data.currentSalary}, ${data.salaryBand?.min || 0}, ${data.salaryBand?.mid || 0},
      ${data.salaryBand?.max || 0}, ${data.marketRate || 0}, ${data.inflation || 3.2},
      ${data.performanceScore || 3.0}, ${JSON.stringify(data.highlights || [])},
      ${data.githubUsername || ''}, ${data.lastReview || new Date().toISOString().split('T')[0]})
    RETURNING *
  `;
  return rowToEmployee(rows[0], [], [], [], []);
}

export async function updateEmployee(userId, employeeId, data) {
  // Verify ownership
  const { rows: check } = await sql`
    SELECT id FROM employees WHERE id = ${employeeId} AND user_id = ${userId}
  `;
  if (check.length === 0) return null;

  // Update main employee record
  await sql`
    UPDATE employees SET
      name = ${data.name}, role = ${data.role}, department = ${data.department},
      avatar = ${data.avatar}, current_salary = ${data.currentSalary},
      salary_band_min = ${data.salaryBand?.min || 0}, salary_band_mid = ${data.salaryBand?.mid || 0},
      salary_band_max = ${data.salaryBand?.max || 0}, market_rate = ${data.marketRate || 0},
      inflation = ${data.inflation || 3.2}, performance_score = ${data.performanceScore || 3.0},
      highlights = ${JSON.stringify(data.highlights || [])},
      github_username = ${data.githubUsername || ''}, github_data = ${data.githubData ? JSON.stringify(data.githubData) : null},
      last_review = ${data.lastReview || null}
    WHERE id = ${employeeId} AND user_id = ${userId}
  `;

  // Sync personal goals: delete all and re-insert
  await sql`DELETE FROM personal_goals WHERE employee_id = ${employeeId}`;
  for (const g of (data.personalGoals || [])) {
    await sql`
      INSERT INTO personal_goals (employee_id, title, why, specific, measurable, achievable, relevant, time_bound, progress, weight, status)
      VALUES (${employeeId}, ${g.title}, ${g.why || ''}, ${g.specific || ''}, ${g.measurable || ''},
        ${g.achievable || ''}, ${g.relevant || ''}, ${g.timeBound || ''}, ${g.progress || 0},
        ${g.weight || 20}, ${g.status || 'not-started'})
    `;
  }

  // Sync team goals
  await sql`DELETE FROM team_goals WHERE employee_id = ${employeeId}`;
  for (const g of (data.teamGoals || [])) {
    await sql`
      INSERT INTO team_goals (employee_id, title, measurable, deadline, progress, contribution)
      VALUES (${employeeId}, ${g.title}, ${g.measurable || ''}, ${g.deadline || null},
        ${g.progress || 0}, ${g.contribution || 'medium'})
    `;
  }

  // Sync extras
  await sql`DELETE FROM extras WHERE employee_id = ${employeeId}`;
  for (const e of (data.extras || [])) {
    await sql`
      INSERT INTO extras (employee_id, text, category, date)
      VALUES (${employeeId}, ${e.text}, ${e.category || 'initiative'}, ${e.date || ''})
    `;
  }

  // Sync competency assessments + milestones
  // First delete old milestones (via cascade) and assessments
  await sql`
    DELETE FROM milestones WHERE assessment_id IN (
      SELECT id FROM competency_assessments WHERE employee_id = ${employeeId}
    )
  `;
  await sql`DELETE FROM competency_assessments WHERE employee_id = ${employeeId}`;
  for (const a of (data.competencyAssessments || [])) {
    const { rows: caRows } = await sql`
      INSERT INTO competency_assessments (employee_id, competency_id, met, is_target)
      VALUES (${employeeId}, ${a.competencyId}, ${a.met || false}, ${a.isTarget || false})
      RETURNING id
    `;
    for (const m of (a.milestones || [])) {
      await sql`
        INSERT INTO milestones (assessment_id, title, status, due_date)
        VALUES (${caRows[0].id}, ${m.title}, ${m.status || 'pending'}, ${m.dueDate || null})
      `;
    }
  }

  return await getEmployee(userId, employeeId);
}

export async function deleteEmployee(userId, employeeId) {
  const { rowCount } = await sql`
    DELETE FROM employees WHERE id = ${employeeId} AND user_id = ${userId}
  `;
  return rowCount > 0;
}

// ── Roles ──

export async function getRoles(userId) {
  const { rows } = await sql`SELECT * FROM roles WHERE user_id = ${userId} ORDER BY id`;
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    department: r.department,
    salaryBand: { min: r.salary_band_min, mid: r.salary_band_mid, max: r.salary_band_max },
    marketRate: r.market_rate,
  }));
}

export async function createRole(userId, data) {
  const { rows } = await sql`
    INSERT INTO roles (user_id, name, department, salary_band_min, salary_band_mid, salary_band_max, market_rate)
    VALUES (${userId}, ${data.name}, ${data.department}, ${data.salaryBand?.min || 0},
      ${data.salaryBand?.mid || 0}, ${data.salaryBand?.max || 0}, ${data.marketRate || 0})
    RETURNING *
  `;
  const r = rows[0];
  return { id: r.id, name: r.name, department: r.department, salaryBand: { min: r.salary_band_min, mid: r.salary_band_mid, max: r.salary_band_max }, marketRate: r.market_rate };
}

export async function updateRole(userId, roleId, data) {
  const { rows } = await sql`
    UPDATE roles SET name = ${data.name}, department = ${data.department},
      salary_band_min = ${data.salaryBand?.min || 0}, salary_band_mid = ${data.salaryBand?.mid || 0},
      salary_band_max = ${data.salaryBand?.max || 0}, market_rate = ${data.marketRate || 0}
    WHERE id = ${roleId} AND user_id = ${userId}
    RETURNING *
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return { id: r.id, name: r.name, department: r.department, salaryBand: { min: r.salary_band_min, mid: r.salary_band_mid, max: r.salary_band_max }, marketRate: r.market_rate };
}

export async function deleteRole(userId, roleId) {
  const { rowCount } = await sql`DELETE FROM roles WHERE id = ${roleId} AND user_id = ${userId}`;
  return rowCount > 0;
}

// ── Settings ──

export async function getSettings(userId) {
  const { rows } = await sql`SELECT * FROM settings WHERE user_id = ${userId}`;
  if (rows.length === 0) {
    // Create default settings for new user
    await sql`INSERT INTO settings (user_id, budget, github_org) VALUES (${userId}, 15000, 'collaborationFactory')`;
    return { budget: 15000, githubOrg: 'collaborationFactory' };
  }
  return { budget: rows[0].budget, githubOrg: rows[0].github_org };
}

export async function saveSettings(userId, data) {
  await sql`
    INSERT INTO settings (user_id, budget, github_org)
    VALUES (${userId}, ${data.budget || 15000}, ${data.githubOrg || 'collaborationFactory'})
    ON CONFLICT (user_id) DO UPDATE SET
      budget = ${data.budget || 15000}, github_org = ${data.githubOrg || 'collaborationFactory'}
  `;
}

// ── Competencies ──

export async function getCompetencies(userId) {
  // Get global competencies
  const { rows: globalRows } = await sql`SELECT * FROM global_competencies ORDER BY id`;
  // Get user overrides
  const { rows: userRows } = await sql`SELECT * FROM user_competencies WHERE user_id = ${userId} ORDER BY id`;

  const globals = globalRows.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    tag: c.tag,
    expectations: c.expectations,
    isCustom: false,
  }));

  // Merge: user competencies override globals by name
  const userByName = new Map(userRows.map(c => [c.name, c]));
  const merged = globals.map(g => {
    const override = userByName.get(g.name);
    if (override) {
      userByName.delete(g.name);
      return { id: g.id, name: override.name, category: override.category, tag: override.tag, expectations: override.expectations, isCustom: true };
    }
    return g;
  });

  // Add any user competencies that don't override globals
  for (const [, c] of userByName) {
    merged.push({ id: 1000 + c.id, name: c.name, category: c.category, tag: c.tag, expectations: c.expectations, isCustom: true });
  }

  return merged;
}

// ── GitHub Token ──

export async function getGitHubToken(userId) {
  const { rows } = await sql`
    SELECT access_token FROM accounts WHERE "userId" = ${userId} AND provider = 'github'
  `;
  return rows.length > 0 ? rows[0].access_token : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/db.js
git commit -m "feat: add Postgres database query layer"
```

---

### Task 6: Auth helper for API routes

**Files:**
- Create: `lib/api-auth.js`

A small helper that extracts the authenticated user from the session in API routes.

- [ ] **Step 1: Create `lib/api-auth.js`**

```javascript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user: session.user, error: null };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/api-auth.js
git commit -m "feat: add API auth helper"
```

---

### Task 7: Update all API routes to use auth + database

**Files:**
- Modify: `app/api/employees/route.js`
- Modify: `app/api/employees/[id]/route.js`
- Modify: `app/api/roles/route.js`
- Modify: `app/api/roles/[id]/route.js`
- Modify: `app/api/settings/route.js`
- Modify: `app/api/competencies/route.js`
- Modify: `app/api/employees/[id]/github-sync/route.js`

- [ ] **Step 1: Rewrite `app/api/employees/route.js`**

```javascript
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
```

- [ ] **Step 2: Rewrite `app/api/employees/[id]/route.js`**

```javascript
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
```

- [ ] **Step 3: Rewrite `app/api/roles/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getRoles, createRole } from '@/lib/db';

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const roles = await getRoles(user.id);
  return NextResponse.json(roles);
}

export async function POST(request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  const newRole = await createRole(user.id, body);
  return NextResponse.json(newRole, { status: 201 });
}
```

- [ ] **Step 4: Rewrite `app/api/roles/[id]/route.js`**

```javascript
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
```

- [ ] **Step 5: Rewrite `app/api/settings/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getSettings, saveSettings } from '@/lib/db';

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const settings = await getSettings(user.id);
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  await saveSettings(user.id, body);
  return NextResponse.json(body);
}
```

- [ ] **Step 6: Rewrite `app/api/competencies/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getCompetencies } from '@/lib/db';

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const competencies = await getCompetencies(user.id);
  return NextResponse.json(competencies);
}
```

- [ ] **Step 7: Rewrite `app/api/employees/[id]/github-sync/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getEmployee, updateEmployee, getSettings, getGitHubToken } from '@/lib/db';

function validateInput(value, label) {
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return value;
}

function validateDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return value;
}

async function searchPRs(token, githubOrg, username, startDate, endDate, option) {
  const safeOrg = validateInput(githubOrg, 'githubOrg');
  const safeUser = validateInput(username, 'username');
  const safeStart = validateDate(startDate, 'startDate');
  const safeEnd = validateDate(endDate, 'endDate');

  const q = `is:merged is:pr user:${safeOrg} merged:${safeStart}..${safeEnd} ${option}:${safeUser}`;
  const allItems = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`;
    const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'performance-hub' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      console.error(`GitHub API error (${res.status}):`, text);
      if (res.status === 403 || res.status === 429) break;
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const data = await res.json();
    allItems.push(...data.items);
    if (data.items.length < perPage || allItems.length >= data.total_count) break;
    if (page >= 5) break;
    page++;
  }

  return allItems.map(item => ({
    url: item.html_url,
    repository: { name: item.repository_url.split('/').pop() },
  }));
}

function getMonthlyRanges(startDate, endDate) {
  const ranges = [];
  let cursor = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (cursor < end) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const periodEnd = monthEnd > end ? end : monthEnd;
    const fmt = (d) => d.toISOString().split('T')[0];
    ranges.push({ start: fmt(monthStart), end: fmt(periodEnd) });
    cursor = monthEnd;
  }
  return ranges;
}

export async function POST(request, { params }) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { endDate, startDate: requestedStartDate, githubUsername: bodyUsername } = body;

  if (!endDate) {
    return NextResponse.json({ error: 'endDate is required' }, { status: 400 });
  }

  const emp = await getEmployee(user.id, parseInt(id));
  if (!emp) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const username = bodyUsername || emp.githubUsername;
  if (!username) {
    return NextResponse.json({ error: 'Employee has no githubUsername set' }, { status: 400 });
  }

  // Get the user's GitHub OAuth token
  const token = await getGitHubToken(user.id);

  const settings = await getSettings(user.id);
  const githubOrg = settings.githubOrg || 'collaborationFactory';

  const githubData = emp.githubData || { lastSyncedEnd: null, periods: [] };
  let startDate = requestedStartDate;
  if (!startDate && githubData.lastSyncedEnd) {
    startDate = githubData.lastSyncedEnd;
  }
  if (!startDate) {
    return NextResponse.json({ error: 'startDate is required for initial sync' }, { status: 400 });
  }

  const monthlyRanges = getMonthlyRanges(startDate, endDate);

  try {
    for (const range of monthlyRanges) {
      const exists = githubData.periods.some(p => p.startDate === range.start && p.endDate === range.end);
      if (exists) continue;

      const assignedPRs = await searchPRs(token, githubOrg, username, range.start, range.end, 'assignee');
      const reviewedPRs = await searchPRs(token, githubOrg, username, range.start, range.end, 'reviewed-by');
      const repositories = [...new Set(assignedPRs.map(pr => pr.repository.name))];

      githubData.periods.push({
        timePeriod: `${range.start}-to-${range.end}`,
        startDate: range.start,
        endDate: range.end,
        pullRequestsCount: assignedPRs.length,
        reviewsCount: reviewedPRs.length,
        repositoriesCount: repositories.length,
        repositories,
        pullRequests: assignedPRs.map(pr => pr.url),
        reviewedPullRequests: reviewedPRs.map(pr => pr.url),
      });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  githubData.periods.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  githubData.lastSyncedEnd = endDate;

  // Update employee with new github data (and possibly username)
  const updatedEmp = { ...emp, githubData, githubUsername: username };
  await updateEmployee(user.id, parseInt(id), updatedEmp);

  return NextResponse.json(githubData);
}
```

- [ ] **Step 8: Commit**

```bash
git add app/api/employees/route.js "app/api/employees/[id]/route.js" \
  "app/api/employees/[id]/github-sync/route.js" app/api/roles/route.js \
  "app/api/roles/[id]/route.js" app/api/settings/route.js app/api/competencies/route.js
git commit -m "feat: update all API routes to use auth + Postgres"
```

---

### Task 8: Session provider and layout

**Files:**
- Create: `components/SessionWrapper.jsx`
- Modify: `app/layout.js`

- [ ] **Step 1: Create `components/SessionWrapper.jsx`**

```jsx
'use client';

import { SessionProvider } from 'next-auth/react';

export default function SessionWrapper({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Update `app/layout.js`**

```javascript
import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';

export const metadata = {
  title: 'PerformanceHub',
  description: 'Employee performance management dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/SessionWrapper.jsx app/layout.js
git commit -m "feat: add SessionProvider wrapper to layout"
```

---

### Task 9: Landing page

**Files:**
- Modify: `app/page.js`

- [ ] **Step 1: Rewrite `app/page.js` as the landing page**

```jsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

export default async function Page() {
  const session = await auth();
  if (session) {
    redirect('/dashboard');
  }
  return <LandingPage />;
}
```

- [ ] **Step 2: Create `components/LandingPage.jsx`**

```jsx
'use client';

import { signIn } from 'next-auth/react';

export default function LandingPage() {
  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <div className="header-logo">◆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text)', margin: 0 }}>
            PerformanceHub
          </h1>
        </div>

        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40 }}>
          Performance-Management für Engineering-Teams. Kompetenzen bewerten, SMART-Ziele verwalten, GitHub-Aktivität tracken und datenbasierte Gehaltsempfehlungen berechnen.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 48 }}>
          {[
            { icon: '◈', text: 'Kompetenz-Matrix mit Entwicklungszielen' },
            { icon: '◉', text: 'SMART-Ziele mit Markdown-Import' },
            { icon: '◎', text: 'GitHub-Aktivität automatisch synchronisieren' },
            { icon: '◇', text: 'Datenbasierte Gehaltsempfehlungen' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)', fontSize: 16 }}>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        <button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          style={{
            padding: '14px 32px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => { e.target.style.boxShadow = '0 0 24px var(--accent-glow)'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}
        >
          Mit GitHub anmelden
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 16 }}>
          Deine Daten werden isoliert gespeichert. Nur du hast Zugriff.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.js components/LandingPage.jsx
git commit -m "feat: add landing page with GitHub sign-in"
```

---

### Task 10: Dashboard page

**Files:**
- Create: `app/dashboard/page.js`
- Modify: `components/App.jsx`

- [ ] **Step 1: Create `app/dashboard/page.js`**

```jsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import App from '@/components/App';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect('/');
  }
  return <App user={session.user} />;
}
```

- [ ] **Step 2: Update `components/App.jsx` to accept user prop and show avatar/logout**

Add `user` to the destructured props:

```jsx
export default function App({ user }) {
```

In the header, replace the period badge with user info and logout:

Replace:
```jsx
<div className="header-period">Q1 2026</div>
```

With:
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  {user?.image && (
    <img src={user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)' }} />
  )}
  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.name}</span>
  <button
    className="btn btn--ghost"
    style={{ fontSize: 11 }}
    onClick={() => { import('next-auth/react').then(m => m.signOut({ callbackUrl: '/' })); }}
  >
    Abmelden
  </button>
</div>
```

Do the same in the loading state header.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.js components/App.jsx
git commit -m "feat: add protected dashboard page with user avatar and logout"
```

---

### Task 11: Remove old data layer

**Files:**
- Delete: `lib/data.js`
- Delete: `.env.example`

- [ ] **Step 1: Delete old files**

```bash
rm lib/data.js .env.example
```

- [ ] **Step 2: Commit**

```bash
git add lib/data.js .env.example
git commit -m "chore: remove JSON data layer and old env example"
```

---

### Task 12: Environment configuration

**Files:**
- Create: `.env.example` (new version)

- [ ] **Step 1: Create new `.env.example`**

```
# Vercel Postgres (auto-configured by Vercel when you add the integration)
POSTGRES_URL=

# GitHub OAuth App — create at https://github.com/settings/applications/new
# Callback URL: https://your-domain.com/api/auth/callback/github
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# NextAuth secret — generate with: npx auth secret
AUTH_SECRET=
```

- [ ] **Step 2: Add migrate script reference to README or a comment in package.json**

The `"migrate"` script was already added in Task 2.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add env example for Postgres and GitHub OAuth"
```

---

### Task 13: Verify build

- [ ] **Step 1: Check build compiles**

```bash
npm run build
```

Note: Build will warn about missing env vars locally — that's expected. The Postgres connection only works when connected to Vercel Postgres (via `vercel env pull` or on deployment).

- [ ] **Step 2: Fix any import/compilation errors**

If there are errors referencing `lib/data.js`, check that all API routes were updated in Task 7. Fix any remaining references.

- [ ] **Step 3: Final commit if needed**

```bash
git add -A
git commit -m "fix: resolve any remaining build issues"
```
