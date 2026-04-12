# Multi-User Authentication — Design Spec

## Overview

Add GitHub OAuth authentication to make Performance Hub a public multi-user app. Each user gets their own isolated workspace. The GitHub OAuth token doubles as the credential for PR sync, eliminating separate token management.

---

## Authentication

**Provider:** NextAuth.js v5 (Auth.js) with GitHub OAuth provider.

**Flow:**
1. User visits landing page → clicks "Sign in with GitHub"
2. Redirected to GitHub OAuth consent screen
3. GitHub redirects back → NextAuth exchanges code for access token
4. User created/updated in `users` table with encrypted GitHub token
5. Database session created → session cookie set
6. All app routes and API routes require authentication
7. GitHub access token from session used for PR sync API calls

**GitHub OAuth App config:**
- Scopes: `read:user`, `user:email`, `repo`
- Callback URL: `https://<domain>/api/auth/callback/github`

**Session strategy:** Database sessions in Vercel Postgres (via NextAuth Postgres adapter). Chosen over JWT because the GitHub token is sensitive and JWTs have size limits.

**Token refresh:** GitHub OAuth tokens don't expire by default. If a request fails with 401, show re-authentication message.

---

## Database Schema (Vercel Postgres)

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| github_id | INTEGER | Unique, from GitHub OAuth |
| name | TEXT | |
| email | TEXT | |
| avatar_url | TEXT | |
| ~~github_token~~ | — | Stored in NextAuth `accounts` table as `access_token` |
| created_at | TIMESTAMP | |

### employees
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| user_id | UUID | FK → users |
| name | TEXT | |
| role | TEXT | |
| department | TEXT | |
| avatar | TEXT | Initials |
| current_salary | INTEGER | |
| salary_band_min | INTEGER | |
| salary_band_mid | INTEGER | |
| salary_band_max | INTEGER | |
| market_rate | INTEGER | |
| inflation | NUMERIC | |
| performance_score | NUMERIC | |
| highlights | JSONB | Array of strings |
| github_username | TEXT | |
| github_data | JSONB | Periods array |
| last_review | DATE | |
| created_at | TIMESTAMP | |

### personal_goals
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| employee_id | INTEGER | FK → employees |
| title | TEXT | |
| why | TEXT | SMART field |
| specific | TEXT | SMART field |
| measurable | TEXT | SMART field |
| achievable | TEXT | SMART field |
| relevant | TEXT | SMART field |
| time_bound | TEXT | SMART field |
| progress | INTEGER | 0-100 |
| weight | INTEGER | |
| status | TEXT | not-started, behind, at-risk, on-track, completed |

### team_goals
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| employee_id | INTEGER | FK → employees |
| title | TEXT | |
| measurable | TEXT | |
| deadline | DATE | |
| progress | INTEGER | 0-100 |
| contribution | TEXT | low, medium, high |

### extras
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| employee_id | INTEGER | FK → employees |
| text | TEXT | |
| category | TEXT | reliability, initiative, innovation, culture, quality |
| date | TEXT | e.g., "2026-Q1" |

### competency_assessments
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| employee_id | INTEGER | FK → employees |
| competency_id | INTEGER | References global or user competency |
| met | BOOLEAN | |
| is_target | BOOLEAN | |

### milestones
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| assessment_id | INTEGER | FK → competency_assessments |
| title | TEXT | |
| status | TEXT | pending, done |
| due_date | DATE | |

### roles
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| user_id | UUID | FK → users |
| name | TEXT | |
| department | TEXT | |
| salary_band_min | INTEGER | |
| salary_band_mid | INTEGER | |
| salary_band_max | INTEGER | |
| market_rate | INTEGER | |

### settings
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | PK, FK → users |
| budget | INTEGER | |
| github_org | TEXT | |

### user_competencies
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| user_id | UUID | FK → users |
| name | TEXT | |
| category | TEXT | |
| tag | TEXT | SKILL, RESPONSIBILITY, SCALE |
| expectations | JSONB | Role → description mapping |

### NextAuth tables (managed by `@auth/pg-adapter`)
- `accounts` — OAuth provider accounts linked to users. **Stores `access_token`** from GitHub OAuth — this is the token used for PR sync.
- `sessions` — Active database sessions
- `verification_tokens` — Required by adapter schema, not used

---

## Data Scoping

All queries are scoped by `user_id` extracted from the authenticated session:
- `getEmployees(userId)` → `SELECT * FROM employees WHERE user_id = $1`
- Same pattern for roles, settings, etc.
- Employee sub-data (goals, extras, assessments) is scoped indirectly through the employee's `user_id`

**Competency catalog:**
- Global defaults loaded from a seeded `competencies` table (read-only, shared)
- User overrides stored in `user_competencies`
- API merges: user-specific competencies override global ones by matching `name`

**New user flow:** Clean slate — no employees, no roles, no settings. User creates everything from scratch.

---

## Route Structure

```
/                              → Landing page (public)
/dashboard                     → Main app (protected)
/api/auth/[...nextauth]        → NextAuth handlers (public)
/api/employees                 → CRUD, scoped to user
/api/employees/[id]            → CRUD, scoped to user
/api/employees/[id]/github-sync → Uses user's GitHub token from session
/api/roles                     → CRUD, scoped to user
/api/settings                  → CRUD, scoped to user
/api/competencies              → GET returns merged global + user overrides
```

**Middleware:** Next.js middleware redirects unauthenticated users from `/dashboard` (and all protected routes) to `/`.

---

## Landing Page

Simple page matching the existing dark theme:
- Headline: app name and one-line description (performance management for engineering teams)
- Key features listed (competency tracking, SMART goals, GitHub activity, salary recommendations)
- Prominent "Sign in with GitHub" button
- No signup form — GitHub OAuth is the only auth method

---

## App Shell Changes

- Current `App.jsx` moves to `/dashboard` page
- Header gets user avatar (from GitHub) and logout button
- `lib/data.js` (JSON file layer) replaced by `lib/db.js` (Postgres queries)
- All API routes add session check and extract `userId`
- JSON data files (`data/`) kept for reference only, not used at runtime

---

## GitHub PR Sync Changes

- Remove `execFileSync` / `gh` CLI dependency
- Use GitHub REST API with `fetch` (already done)
- Token source: `accounts.access_token` from the NextAuth `accounts` table, looked up via the authenticated session (not env var, not per-employee)
- Remove `GITHUB_TOKEN` env var and `.env.example`
- Remove `githubToken` from sync request body — API route reads it from session

---

## Environment Variables

```
# Vercel Postgres (auto-configured by Vercel)
POSTGRES_URL=...

# GitHub OAuth App
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# NextAuth
AUTH_SECRET=... (generated, for encrypting sessions)
```

---

## Files Affected

**New:**
- `lib/db.js` — Postgres query layer
- `lib/auth.js` — NextAuth configuration
- `app/api/auth/[...nextauth]/route.js` — NextAuth API route
- `app/page.js` — Landing page (replaces current home)
- `app/dashboard/page.js` — Protected dashboard
- `middleware.js` — Auth redirect middleware
- `scripts/migrate.js` — Database migration/seed script

**Modified:**
- `app/api/employees/route.js` — Add auth, use db.js
- `app/api/employees/[id]/route.js` — Add auth, use db.js
- `app/api/employees/[id]/github-sync/route.js` — Use token from session
- `app/api/roles/route.js` — Add auth, use db.js
- `app/api/roles/[id]/route.js` — Add auth, use db.js
- `app/api/settings/route.js` — Add auth, use db.js
- `app/api/competencies/route.js` — Add auth, merge user overrides
- `components/App.jsx` — Add logout, user avatar
- `app/layout.js` — Add SessionProvider
- `package.json` — Add dependencies (next-auth, @auth/pg-adapter, pg)

**Removed:**
- `lib/data.js` — Replaced by db.js
- `.env.example` — Replaced by new env vars
- `data/employees.json`, `data/settings.json` — No longer used at runtime
