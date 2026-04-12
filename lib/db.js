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
