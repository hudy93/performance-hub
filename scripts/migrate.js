import pg from 'pg';
import { readFile } from 'fs/promises';
import path from 'path';

// Load .env.local manually since this runs outside Next.js
const envPath = path.join(process.cwd(), '.env.local');
try {
  const envContent = await readFile(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* .env.local may not exist in production */ }

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

const sql = async (strings, ...values) => {
  let query = '';
  const params = [];
  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      query += `$${params.length}`;
    }
  }
  return pool.query(query, params);
};

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
      github_org TEXT DEFAULT ''
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

migrate()
  .then(() => pool.end())
  .catch(err => {
    console.error('Migration failed:', err);
    pool.end();
    process.exit(1);
  });
