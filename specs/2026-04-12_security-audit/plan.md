# Security Hardening Implementation Plan

## Overview

Harden PerformanceHub against the 22 findings from the security audit. Covers middleware bugs, missing input validation, absent security headers, token exposure, lack of rate limiting, and inconsistent error handling. All architectural decisions are documented in `design.md`.

## Current State Analysis

- **Middleware** (`middleware.js:1-43`): Catch-all matcher with no public route exceptions. Blocks OAuth flow and redirects `/` to itself for unauthenticated users.
- **Auth** (`lib/auth.js:1-48`): GitHub token stored in JWT and exposed via `session.accessToken`. OAuth scope is `read:user user:email repo` (overly broad).
- **API routes**: 7 route files, only github-sync has try/catch and input validation. No Zod or schema validation anywhere.
- **Security headers**: None configured — no CSP, HSTS, X-Frame-Options, etc.
- **Rate limiting**: None.
- **Dependencies**: Dead `@vercel/postgres` in `package.json:16`.
- **Migration script** (`scripts/migrate.js:23`): `rejectUnauthorized: false` on TLS.

### Key Discoveries:
- `lib/db.js:325-330` already has a `getGitHubToken(userId)` function that fetches from the `accounts` table — we can reuse this directly.
- `lib/api-auth.js:9` currently returns `accessToken` from session — this needs updating after token removal.
- `app/api/employees/[id]/github-sync/route.js:97` uses `accessToken` from `getAuthUser()` — must switch to DB fetch.
- The github-sync route (`route.js:134-135`) leaks error messages including reflected user input: `return NextResponse.json({ error: err.message }, { status: 500 })`.
- All `parseInt(id)` calls on path params (`employees/[id]/route.js:11,23`, `roles/[id]/route.js:9,17`) don't validate for NaN.

## Desired End State

After implementation:
1. OAuth sign-in/callback works without errors
2. `/`, `/impressum`, `/datenschutz` accessible without auth
3. All responses include security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
4. All mutation endpoints reject malformed input with 400
5. GitHub token not in JWT payload or client session
6. github-sync returns 429 when rate limit exceeded
7. No unhandled error details leaked to clients
8. No dead dependencies
9. All existing functionality works (no regressions)

### How to verify:
- `npm run build` succeeds
- `npm run lint` passes
- Manual test: sign out → visit `/impressum` → page loads
- Manual test: sign in via GitHub → redirected to dashboard
- Manual test: check response headers in browser DevTools
- Manual test: POST malformed JSON to mutation endpoints → get 400
- Manual test: trigger github-sync rapidly → get 429

## What We're NOT Doing

- Upgrading next-auth from beta.30
- Adding RBAC or permission hierarchy
- Encrypting tokens at rest in the database
- Global rate limiting via external service (Upstash)
- Adding TypeScript
- Automated security scanning (SAST/DAST)
- Refresh token rotation for GitHub OAuth
- `.npmrc` version control

## Implementation Approach

Six sequential phases, each independently testable. Order matters: middleware fix first (unblocks OAuth), then token removal (reduces exposure surface), then validation (protects data layer), then rate limiting and error handling, then cleanup.

---

## Phase 1: Middleware Restructuring + Security Headers

### Overview
Fix the two CRITICAL bugs (OAuth blocking, redirect loop) and add security headers to all responses. This is the highest-priority phase.

### Changes Required:

#### 1. Middleware — Public Routes + Security Headers
**File**: `middleware.js`
**Changes**: Add public routes array, restructure to apply headers on all requests, skip auth only for public routes.

```javascript
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

const PUBLIC_ROUTES = [
  '/api/auth',     // NextAuth OAuth flow
  '/impressum',    // Legal (TMG §5)
  '/datenschutz',  // Legal (GDPR)
];

function isPublicRoute(pathname) {
  // Root page is public (landing / sign-in page)
  if (pathname === '/') return true;
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://avatars.githubusercontent.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

function applySecurityHeaders(response) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Maintenance mode
  if (isMaintenanceMode) {
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname === '/'
    ) {
      return applySecurityHeaders(NextResponse.next());
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  // Public routes — skip auth, still get headers
  if (isPublicRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Auth check for private routes
  const isSecure = request.nextUrl.protocol === 'https:';
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
    secureCookie: isSecure,
  });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

#### 2. next.config.js — Disable X-Powered-By + Restrict Image Domains
**File**: `next.config.js`
**Changes**: Add `poweredByHeader: false` and `images.remotePatterns`.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'pg-native'];
    return config;
  },
};

export default nextConfig;
```

### Success Criteria:

#### Automated Verification:
- [x] `npm run build` succeeds
- [x] `npm run lint` passes

#### Manual Verification:
- [ ] Visit `/` without auth → landing page loads (no redirect loop)
- [ ] Visit `/impressum` without auth → legal page loads
- [ ] Visit `/datenschutz` without auth → legal page loads
- [ ] Sign in via GitHub OAuth → flow completes, redirected to dashboard
- [ ] Check any response in DevTools → all 6 security headers present
- [ ] `X-Powered-By` header absent from responses
- [ ] Private routes still return 401 when not authenticated

---

## Phase 2: Server-Side Only Token Access

### Overview
Remove GitHub token from JWT and session. Fetch token from DB only when needed server-side. Reduce OAuth scope.

### Changes Required:

#### 1. Auth Config — Remove Token from JWT/Session
**File**: `lib/auth.js`
**Changes**: Remove `account.access_token` from JWT callback, remove `session.accessToken` from session callback, reduce OAuth scope.

```javascript
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: 'jwt' },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email read:org',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      return session;
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV !== 'production',
  logger: {
    error: (code, ...message) => {
      console.error('[auth][error]', code, ...message);
    },
    warn: (code) => {
      console.warn('[auth][warn]', code);
    },
  },
});
```

#### 2. API Auth Helper — Remove accessToken from Return
**File**: `lib/api-auth.js`
**Changes**: Stop returning `accessToken` from session.

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

#### 3. GitHub Sync Route — Use DB Token
**File**: `app/api/employees/[id]/github-sync/route.js`
**Changes**: Import `getGitHubToken` from `lib/db.js`, fetch token from DB instead of session. Remove `accessToken` from `getAuthUser()` destructure.

Replace line 75 (`const { user, accessToken, error } = await getAuthUser();`) with:
```javascript
const { user, error } = await getAuthUser();
```

Replace line 97 (`const token = accessToken;`) with:
```javascript
import { getGitHubToken } from '@/lib/db';
// ... inside handler:
const token = await getGitHubToken(user.id);
```

The `getGitHubToken` function already exists at `lib/db.js:325-330`.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Sign in via GitHub → session works, dashboard loads
- [ ] Inspect JWT cookie (base64 decode) → no `accessToken` field present (implementation done, needs manual verification)
- [ ] `session` object in client components → no `accessToken` property
- [ ] GitHub sync still works (fetches PRs correctly)
- [ ] **Note**: Existing users may need to re-authenticate to pick up the new OAuth scope. The old `repo` token stored in the `accounts` table will still work for PR searches — the scope reduction only affects new OAuth grants.

---

## Phase 3: Input Validation with Zod

### Overview
Add `zod` dependency and define validation schemas for all mutation endpoints. Reject malformed input with 400.

### Changes Required:

#### 1. Install Zod
```bash
npm install zod
```

#### 2. Employee Create — POST /api/employees
**File**: `app/api/employees/route.js`
**Changes**: Add Zod schema, validate body before passing to `createEmployee`.

```javascript
import { z } from 'zod';

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
  inflation: z.number().min(0).max(100).optional().default(3.2),
  performanceScore: z.number().min(0).max(5).optional().default(3.0),
  highlights: z.array(z.string().max(500)).max(20).optional().default([]),
  githubUsername: z.string().max(100).optional().default(''),
  lastReview: z.string().max(20).optional().nullable(),
});
```

Validate in POST handler:
```javascript
const body = await request.json();
const result = createEmployeeSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
const newEmployee = await createEmployee(user.id, result.data);
```

#### 3. Employee Update — PUT /api/employees/[id]
**File**: `app/api/employees/[id]/route.js`
**Changes**: Add Zod schema for full employee update (includes goals, extras, assessments with array limits). Also validate `parseInt(id)` for NaN.

```javascript
import { z } from 'zod';

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
  inflation: z.number().min(0).max(100).optional().default(3.2),
  performanceScore: z.number().min(0).max(5).optional().default(3.0),
  highlights: z.array(z.string().max(500)).max(20).optional().default([]),
  githubUsername: z.string().max(100).optional().default(''),
  githubData: z.any().optional().nullable(),
  lastReview: z.string().max(20).optional().nullable(),
  personalGoals: z.array(personalGoalSchema).max(50).optional().default([]),
  teamGoals: z.array(teamGoalSchema).max(50).optional().default([]),
  extras: z.array(extraSchema).max(100).optional().default([]),
  competencyAssessments: z.array(competencyAssessmentSchema).max(100).optional().default([]),
});
```

Also add NaN check for path param:
```javascript
const employeeId = parseInt(id);
if (isNaN(employeeId)) {
  return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
}
```

#### 4. Role Create — POST /api/roles
**File**: `app/api/roles/route.js`
**Changes**: Add Zod schema.

```javascript
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1).max(200),
  department: z.string().max(200).optional().default(''),
  salaryBand: z.object({
    min: z.number().int().min(0).max(10000000).optional().default(0),
    mid: z.number().int().min(0).max(10000000).optional().default(0),
    max: z.number().int().min(0).max(10000000).optional().default(0),
  }).optional().default({}),
  marketRate: z.number().int().min(0).max(10000000).optional().default(0),
});
```

#### 5. Role Update — PUT /api/roles/[id]
**File**: `app/api/roles/[id]/route.js`
**Changes**: Same schema as role create, plus NaN check on id.

#### 6. Settings Update — PUT /api/settings
**File**: `app/api/settings/route.js`
**Changes**: Add Zod schema.

```javascript
import { z } from 'zod';

const settingsSchema = z.object({
  budget: z.number().int().min(0).max(100000000).optional().default(15000),
  githubOrg: z.string().max(100).optional().default(''),
});
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] POST `/api/employees` with valid body → 201
- [ ] POST `/api/employees` with missing `name` → 400 `{ error: "Invalid input" }`
- [ ] PUT `/api/employees/abc` → 400 (NaN id)
- [ ] PUT `/api/employees/1` with array of 200 goals → 400 (exceeds max)
- [ ] POST `/api/roles` with valid body → 201
- [ ] PUT `/api/settings` with `budget: -1` → 400
- [ ] All existing CRUD operations still work with valid data

---

## Phase 4: Rate Limiting on GitHub Sync

### Overview
Add simple in-memory IP-based rate limiting to the github-sync endpoint only.

### Changes Required:

#### 1. Rate Limiter in GitHub Sync Route
**File**: `app/api/employees/[id]/github-sync/route.js`
**Changes**: Add rate limiting at the top of the file.

```javascript
// Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 requests per window

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}
```

Add at the start of the POST handler:
```javascript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
if (!checkRateLimit(ip)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] First 5 github-sync requests within 15 minutes → succeed normally
- [ ] 6th request within the window → returns 429 `{ error: "Too many requests" }`
- [ ] After 15 minutes → requests work again

---

## Phase 5: Error Handling Standardization

### Overview
Add try/catch to all route handlers that don't have it. Stop leaking error details.

### Changes Required:

#### 1. Fix github-sync Error Leakage
**File**: `app/api/employees/[id]/github-sync/route.js`
**Changes**: Replace line 135 (`return NextResponse.json({ error: err.message }, { status: 500 });`) with:

```javascript
console.error('POST /api/employees/[id]/github-sync failed:', err);
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

#### 2. Add Try/Catch to GET /api/employees
**File**: `app/api/employees/route.js`
**Changes**: Wrap GET and POST in try/catch.

```javascript
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
    // ... validation + create
  } catch (err) {
    console.error('POST /api/employees failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 3. Add Try/Catch to PUT/DELETE /api/employees/[id]
**File**: `app/api/employees/[id]/route.js`

#### 4. Add Try/Catch to GET/POST /api/roles
**File**: `app/api/roles/route.js`

#### 5. Add Try/Catch to PUT/DELETE /api/roles/[id]
**File**: `app/api/roles/[id]/route.js`

#### 6. Add Try/Catch to GET/PUT /api/settings
**File**: `app/api/settings/route.js`

#### 7. Add Try/Catch to GET /api/competencies
**File**: `app/api/competencies/route.js`

All follow the same pattern from design decision #6:
```javascript
export async function HANDLER(request) {
  try {
    // ... existing logic
  } catch (err) {
    console.error('METHOD /api/path failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Trigger a DB error (e.g., disconnect DB temporarily) → all endpoints return `{ error: "Internal server error" }` with 500, no stack traces or internal details
- [ ] github-sync validation error → no user input reflected in error response
- [ ] Server logs still contain full error details for debugging

---

## Phase 6: Cleanup

### Overview
Remove dead dependency and fix migration script TLS issue.

### Changes Required:

#### 1. Remove Dead Dependency
**File**: `package.json`
**Changes**: Remove `@vercel/postgres` from dependencies.

```bash
npm uninstall @vercel/postgres
```

#### 2. Fix Migration Script TLS
**File**: `scripts/migrate.js`
**Changes**: Remove `rejectUnauthorized: false` — Neon enforces TLS server-side, the client should verify the certificate.

Replace line 23:
```javascript
ssl: process.env.POSTGRES_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
```
with:
```javascript
ssl: process.env.POSTGRES_URL?.includes('localhost') ? false : true,
```

Using `ssl: true` lets Node.js verify the server certificate against its CA bundle, which includes the certificates Neon uses.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run migrate` succeeds against the Neon database (if accessible)

#### Manual Verification:
- [ ] Verify `@vercel/postgres` no longer in `node_modules` or `package-lock.json`
- [ ] Migration script connects with proper TLS verification

---

## Testing Strategy

### Unit Tests:
- No existing test infrastructure — not adding in this pass (out of scope)

### Integration Tests:
- Not in scope — app has no test runner configured

### Manual Testing Steps:
1. Sign out completely → visit `/` → landing page loads
2. Visit `/impressum` → page loads without redirect
3. Visit `/datenschutz` → page loads without redirect
4. Sign in via GitHub → flow completes, dashboard loads
5. Check DevTools Network tab → all responses have security headers
6. Base64-decode the JWT cookie → no `accessToken` field
7. Create an employee with valid data → succeeds
8. Create an employee with `name: ""` → 400
9. Update an employee with 100 personal goals → 400
10. Hit github-sync 6 times rapidly → 6th returns 429
11. Check Vercel logs → errors have full details, no details in client responses

## Performance Considerations

- **Token DB fetch**: Adds one DB query to github-sync and employee GitHub data routes. Negligible — these routes already make multiple GitHub API calls.
- **Zod validation**: Microsecond overhead. No measurable impact.
- **Security headers**: Set in Edge middleware — negligible overhead.
- **Rate limiter Map**: In-memory, per-instance. No cross-instance coordination. Resets on cold start.

## Migration Notes

- **OAuth scope change**: Existing users have `repo` scope tokens stored in `accounts.access_token`. These will continue working. The reduced scope (`read:user user:email read:org`) only applies when a user re-authenticates. The GitHub Search API may work without `repo` scope for public repos — test this during implementation.
- **JWT change**: After deploying, existing JWTs will still contain `accessToken` until they expire (30-day default). This is harmless — the field is simply ignored. New JWTs won't contain it.
- **No database migration needed**: All changes are application-level only.

## References

- Research: [Research Document](./research.md)
- Design: [Design Document](./design.md)
- Middleware: `middleware.js:1-43`
- Auth config: `lib/auth.js:1-48`
- API auth helper: `lib/api-auth.js:1-10`
- DB layer: `lib/db.js:1-331`
- GitHub token helper: `lib/db.js:325-330`
- All API routes: `app/api/`
- Migration script: `scripts/migrate.js:1-252`
