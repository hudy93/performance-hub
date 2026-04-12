# Security Hardening — Design Approach

## Overview

Harden PerformanceHub against the 22 findings identified in the security audit research, covering middleware bugs, missing input validation, absent security headers, token exposure, lack of rate limiting, and inconsistent error handling.

## Problem Statement

PerformanceHub has strong foundations (parameterized SQL, tenant isolation, defense-in-depth auth) but has critical middleware bugs, no input validation on most endpoints, no security headers, overly broad token exposure, and no rate limiting. These gaps must be closed before the app is production-hardened.

### Requirements
- Fix middleware so OAuth, root, and legal pages work correctly for unauthenticated users
- Add security headers to all responses
- Validate all mutation endpoint inputs with schemas
- Remove GitHub token from client exposure; reduce OAuth scope
- Add rate limiting to expensive endpoints
- Standardize error handling across all API routes
- Clean up dead dependencies and config issues

### Constraints
- Next.js 15 App Router on Vercel free/hobby tier
- NextAuth v5 beta.30 — not upgrading in this pass (deferred)
- Small app, likely single user currently — solutions should be proportionate
- German legal compliance: `/impressum` and `/datenschutz` must be publicly accessible
- No TypeScript — validation library must work well with plain JS

## Design Decisions Summary

1. **Middleware Restructuring (Conditional Logic)**: Keep the catch-all matcher but add an explicit public routes array inside the middleware function. Auth is skipped for listed paths; security headers and other middleware logic still runs on all routes.
   - Public routes: `/api/auth/*`, `/`, `/impressum`, `/datenschutz`
   - Fixes both the OAuth blocking bug and the redirect loop
   - Security headers applied universally since middleware always runs

2. **Input Validation with Zod**: Add `zod` as a dependency and define schemas directly in each route file. Validate `req.json()` against the schema before passing to DB functions.
   - Covers all 5 unvalidated mutation endpoints
   - Array fields (goals, competencies, extras) get explicit size limits via Zod
   - Generic 400 responses on validation failure — no field-level details leaked

3. **Security Headers in Middleware**: Set all security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) in middleware on every response.
   - Single source of truth for all headers
   - Covers redirects, 401s, and public pages — not just successful API responses
   - Disable `X-Powered-By` via `next.config.js` (`poweredByHeader: false`)

4. **Per-Route Rate Limiting on GitHub Sync**: Simple in-memory rate limiting on the github-sync endpoint only, not globally.
   - Proportionate to app size — no external service needed
   - Acknowledged limitation: per-instance memory, resets on cold start
   - Upgrade path: Upstash Redis if app scales

5. **Server-Side Only Token Access**: Remove `accessToken` from JWT and session callback. Fetch GitHub token from the `accounts` DB table only when server-side code needs it (github-sync, employee GitHub data).
   - Token never leaves the server, never reaches the client
   - JWT becomes smaller and contains no sensitive material
   - Reduce OAuth scope from `repo` to `read:user user:email read:org`

6. **Explicit Try/Catch in Each Route**: Wrap each route handler in try/catch returning generic 500 JSON responses. Log actual errors server-side.
   - No wrapper abstraction — explicit in each file
   - Consistent with the no-unnecessary-abstractions approach
   - Stops error detail leakage to clients

7. **Defer next-auth Upgrade**: Pin current beta.30 version, document the risk, handle as a separate future task.
   - Avoids compounding risk by changing auth library during security hardening
   - All other fixes are independent of the auth library version

This means:
- Every response gets security headers, regardless of route or auth status
- Unauthenticated users can access OAuth flow, landing page, and legal pages without issues
- All mutation inputs are schema-validated before touching the database
- GitHub tokens are never exposed to the client browser
- The github-sync endpoint has basic abuse protection
- Unhandled errors never leak internal details to clients
- The next-auth upgrade is a clean, isolated future task

Major trade-offs we're accepting:
1. **In-memory rate limiting is per-instance**: On Vercel serverless, each isolate has its own counter. Acceptable for a small app; Upstash is the upgrade path.
2. **Extra DB query for token access**: github-sync and employee GitHub data endpoints now hit the DB to fetch the token. Acceptable — these are already slow (external API calls).
3. **Deferred next-auth upgrade**: Known pre-release library stays in production. Mitigated by all other hardening, and isolated upgrade is safer.
4. **No global rate limiting**: Only github-sync is rate-limited. Other mutation endpoints rely on auth gating. Acceptable at current scale.

What we're NOT doing (out of scope):
- Upgrading next-auth from beta to stable (separate task)
- Adding RBAC or permission hierarchy
- Encrypting tokens at rest in the database
- Adding a global rate limiting service (Upstash)
- Adding TypeScript
- Adding automated security scanning or SAST tooling
- Implementing refresh token rotation for GitHub OAuth

## Design Decisions — Details

### 1. Middleware Restructuring

**Chosen Approach:** Conditional logic inside middleware with public routes array

**Rationale:** The middleware needs to run on all routes to apply security headers universally. A simple array of public path prefixes checked at the top of the middleware function is maintainable and explicit. New public routes are added by appending to the array.

**Alternatives Considered:**
- **Expanded matcher exclusions**: Rejected because public routes would bypass middleware entirely, missing security headers on those responses.
- **Hybrid (matcher + conditional)**: Rejected as unnecessary complexity — two places to reason about route protection.

**Implications:**
- The middleware function grows slightly but gains a clear structure: headers → public route check → auth check
- Static assets (`_next/static`, `_next/image`, `favicon.ico`) stay excluded via the existing matcher regex (they don't need security headers from middleware)

---

### 2. Input Validation with Zod

**Chosen Approach:** Zod schemas defined directly in each route file

**Rationale:** Zod is the most popular validation library in the Next.js ecosystem, works with plain JS, and handles the unbounded array issue naturally via `.array().max(N)`. Schemas live in route files to keep validation close to the endpoint.

**Alternatives Considered:**
- **Manual validation helper**: Rejected — more boilerplate, easy to miss edge cases with nested objects and arrays.
- **Zod with shared wrapper**: Rejected — unnecessary abstraction for 6 endpoints. Zod's `.safeParse()` is already clean enough.

**Implications:**
- New dependency: `zod`
- Each mutation route gets a schema definition and a `schema.safeParse(body)` call
- Validation errors return `{ error: "Invalid input" }` with 400 status — no field details
- Array fields (`personalGoals`, `teamGoals`, `extras`, `competencyAssessments`) get explicit max lengths

---

### 3. Security Headers in Middleware

**Chosen Approach:** All security headers set in middleware

**Rationale:** Since middleware runs on every request (design decision #1), it's the natural single source of truth for response headers. This covers all response types including redirects, 401s, and public page responses.

**Alternatives Considered:**
- **`next.config.js` `headers()`**: Rejected as sole approach — doesn't apply to middleware-generated responses (redirects, 401s).
- **Both middleware + next.config.js**: Rejected — two places to manage headers creates confusion about precedence.

**Headers to add:**
- `Content-Security-Policy`: Restrictive default-src, allow self and specific domains (GitHub avatars)
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: Deny camera, microphone, geolocation, etc.

**Additionally in `next.config.js`:**
- `poweredByHeader: false` to suppress `X-Powered-By: Next.js`
- `images.remotePatterns` to restrict allowed image domains to GitHub avatars

---

### 4. Per-Route Rate Limiting

**Chosen Approach:** Simple in-memory rate limiting on github-sync only

**Rationale:** The app is small and on Vercel free tier. GitHub-sync is the only endpoint that fans out to multiple external API calls (5 pages × 2 searches × N months). Other mutations are cheap DB operations behind auth. A simple IP-based counter with a time window is proportionate.

**Alternatives Considered:**
- **Upstash Redis (`@upstash/ratelimit`)**: Rejected for now — adds external service dependency for a small app. Clear upgrade path if needed.
- **In-memory global middleware rate limiting**: Rejected — same per-instance limitation but applied everywhere unnecessarily.

**Implications:**
- Simple `Map<ip, { count, resetTime }>` in the github-sync route file
- Window: e.g., 5 requests per 15 minutes per IP
- Returns 429 Too Many Requests when exceeded
- Counter resets on cold start (acceptable)

---

### 5. Server-Side Only Token Access

**Chosen Approach:** Remove token from JWT and session; fetch from `accounts` table when needed

**Rationale:** The GitHub token is only needed server-side for github-sync and employee GitHub data. Storing it in the JWT exposes it to any code that can read the cookie (base64-decodable). Fetching from DB is a trivial overhead compared to the GitHub API calls that follow.

**Changes:**
- Remove `account.access_token` from JWT callback in `lib/auth.js`
- Remove `session.accessToken` from session callback in `lib/auth.js`
- Create a helper function to fetch the token from the `accounts` table by `userId`
- Reduce OAuth scope from `repo` to `read:user user:email read:org`
- Update github-sync and employee GitHub data routes to use the DB-fetched token

**Alternatives Considered:**
- **Encrypted JWT (JWE)**: Rejected — token still sent to client (encrypted but present), JWE support in beta next-auth is poorly documented, adds complexity.
- **Keep token in JWT, remove from session only**: Rejected — JWT is still base64-decodable, just removes the convenient `session.accessToken` path while leaving the extraction path open.

---

### 6. Explicit Try/Catch in Each Route

**Chosen Approach:** Manual try/catch in every route handler

**Rationale:** With only 6 route files, the repetition is manageable. Each route gets a clear, readable error boundary. No abstraction overhead.

**Pattern:**
```javascript
export async function POST(request) {
  try {
    const user = await getAuthUser();
    // ... route logic
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/endpoint failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Alternatives Considered:**
- **Higher-order function wrapper**: Rejected — unnecessary abstraction for 6 endpoints, less explicit when reading route files.

---

### 7. next-auth Upgrade (Deferred)

**Chosen Approach:** Pin beta.30, defer upgrade to separate task

**Rationale:** Changing the auth library while simultaneously reworking middleware, token handling, and session callbacks compounds risk. All other security fixes are independent of the auth library version. A dedicated upgrade task can be properly tested in isolation.

**Alternatives Considered:**
- **Upgrade to latest beta**: Rejected for this pass — risk of API changes breaking other security work in progress.
- **Upgrade to stable v5**: Would be ideal if available, but should be a separate task regardless.

---

## Overall Architecture

### Key Components
1. **Middleware (`middleware.js`)**: Central security control — public route allowlist, security headers on all responses, auth gating for private routes
2. **Zod Schemas (per-route)**: Input validation at each mutation endpoint, with array size limits
3. **Token Helper (`lib/github-token.js`)**: Fetches GitHub access token from `accounts` table by userId — used only server-side
4. **Rate Limiter (in github-sync route)**: Simple in-memory IP-based counter for the expensive endpoint

### Data Flow
1. Request hits Edge middleware → security headers added to response
2. Public route? → pass through without auth check
3. Private route? → JWT verified → 401 if invalid
4. API route handler → `getAuthUser()` (defense-in-depth) → Zod validation on mutation → business logic → response
5. GitHub-related routes → rate limit check → fetch token from DB → external API calls

### Integration Points
- Middleware integrates with NextAuth JWT verification (existing)
- Token helper queries the `accounts` table created by NextAuth's PostgresAdapter (existing)
- Zod is a new standalone dependency with no integration requirements

## Technology Choices

**Input Validation:**
- Choice: `zod`
- Why: Most popular in Next.js ecosystem, works with plain JS, handles arrays/nested objects well

**Rate Limiting:**
- Choice: Custom in-memory (no library)
- Why: Proportionate to app size, no external dependencies, upgrade path to Upstash clear

**Security Headers:**
- Choice: Manual header setting in middleware
- Why: Single source of truth, covers all response types

## Trade-offs & Risks

### Accepted Trade-offs
1. **Per-instance rate limiting**: We're accepting ineffective limiting at scale to avoid external service dependency
2. **DB query for token**: We're accepting extra latency on GitHub operations to gain token security
3. **Deferred auth upgrade**: We're accepting a known pre-release dependency to reduce compounded risk during hardening
4. **No global rate limiting**: We're accepting unprotected mutation endpoints (behind auth) to keep scope manageable

### Known Risks
1. **next-auth beta CVEs**: Pre-release library may have undiscovered vulnerabilities — Mitigation: defer upgrade as dedicated task, all other hardening reduces blast radius
2. **Rate limit bypass via distributed IPs**: In-memory counter trivially bypassed — Mitigation: acceptable at current scale, Upstash upgrade path documented
3. **OAuth scope reduction may break features**: Reducing from `repo` to `read:user user:email read:org` may affect GitHub data fetching — Mitigation: test thoroughly, the PR search API may need `public_repo` or no scope at all

## Out of Scope

- Upgrading next-auth from beta to stable
- Adding RBAC or permission hierarchy
- Encrypting tokens at rest in the database
- Global rate limiting via external service
- Adding TypeScript
- Automated security scanning (SAST/DAST)
- Refresh token rotation for GitHub OAuth
- `.npmrc` version control (operational concern)

## Success Criteria

- OAuth sign-in/callback flow works without errors
- `/`, `/impressum`, `/datenschutz` accessible without authentication
- All responses include security headers (verifiable via browser DevTools)
- All mutation endpoints reject malformed input with 400
- GitHub token not present in JWT payload or client session
- github-sync returns 429 when rate limit exceeded
- No unhandled error details leaked to clients
- All existing functionality continues to work (no regressions)

## Next Steps

1. Review this design document
2. Refine if needed based on feedback
3. Proceed to implementation planning: `/create_plan specs/2026-04-12_security-audit/design.md`

## References

- Original research: [Research](./research.md)
- Middleware: `middleware.js:1-43`
- Auth config: `lib/auth.js:1-44`
- API auth helper: `lib/api-auth.js:4-10`
- DB layer: `lib/db.js:6-17`
- All API routes: `app/api/`
