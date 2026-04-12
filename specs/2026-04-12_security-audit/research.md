---
date: 2026-04-12T16:33:32Z
git_commit: 3a41690ff5228dac9bcc7126fee2a5ef9e3815fb
branch: main
topic: "Security Audit — Is everything done in this application?"
tags: [research, security, authentication, api, middleware, xss, sql-injection, headers]
status: complete
last_updated: 2026-04-12
---

# Research: Full Security Audit of PerformanceHub

**Date**: 2026-04-12T16:33:32Z
**Git Commit**: 3a41690ff5228dac9bcc7126fee2a5ef9e3815fb
**Branch**: main

## Research Question
Security-wise, is everything done in this application?

## Summary

PerformanceHub has a **solid foundation** in several critical areas — parameterized SQL queries, consistent multi-tenant data isolation via `user_id`, defense-in-depth auth (middleware + per-route checks), no XSS vectors, and no client-side secret exposure (`NEXT_PUBLIC_`). However, there are **significant gaps** that need addressing before this is production-hardened:

| Area | Status |
|------|--------|
| SQL Injection | **Done** — parameterized queries everywhere |
| Data Isolation | **Done** — all queries scoped by `user_id` |
| XSS Prevention | **Done** — no `dangerouslySetInnerHTML`, React auto-escaping |
| Auth on every route | **Done** — middleware + `getAuthUser()` on all API routes |
| Open Redirects | **Done** — all redirects hardcoded to `/` |
| Timing Attacks | **Done** — JWT-only, no password auth |
| Input Validation | **Missing** on 5 of 6 mutation endpoints |
| Security Headers | **Missing** entirely (CSP, HSTS, X-Frame-Options, etc.) |
| Rate Limiting | **Missing** entirely |
| Middleware Route Gaps | **Broken** — blocks NextAuth routes, redirect loop on `/` |
| GitHub Token Scope | **Overly broad** — `repo` scope when only read is needed |
| GitHub Token in JWT | **Risk** — unencrypted, exposed to client session |
| next-auth Beta | **Risk** — pre-release auth library in production |

---

## Detailed Findings

### 1. Authentication & Session Security

**Framework:** NextAuth v5 (beta.30) with GitHub OAuth, JWT session strategy, PostgresAdapter for user persistence.

#### What's Done Well
- JWT verification via `getToken()` in middleware (`middleware.js:24-29`)
- Cookie name adapts to protocol: `__Secure-authjs.session-token` for HTTPS (`middleware.js:21-22`)
- `httpOnly`, `secure`, `sameSite=lax` cookies via Auth.js defaults
- OAuth `state` parameter automatically generated/validated by Auth.js
- CSRF protection on auth endpoints via Auth.js built-in `csrf-token` cookie
- No password auth = no timing attack vectors

#### Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| **CRITICAL** | Middleware blocks `/api/auth/*` routes — OAuth sign-in/callback returns 401 for unauthenticated users. Login works by accident of library internals, not by design. | `middleware.js:33,42` |
| **CRITICAL** | Middleware redirects unauthenticated users on `/` to `/` — infinite redirect loop. | `middleware.js:35,42` |
| **HIGH** | `next-auth@5.0.0-beta.30` is pre-release. Auth bypass CVEs have occurred in this beta line. | `package.json:19` |
| **HIGH** | GitHub OAuth token (`repo` scope) embedded in JWT payload — signed but **not encrypted**. Can be extracted by base64-decoding the cookie. | `lib/auth.js:28` |
| **HIGH** | GitHub token exposed to client via `session.accessToken` through the session callback. | `lib/auth.js:34` |
| **MEDIUM** | `repo` scope grants full read/write to all user repositories. Only `read:user user:email read:org` is needed for PR search. | `lib/auth.js:17` |
| **MEDIUM** | No explicit `maxAge` on sessions — relies on 30-day Auth.js default. No refresh token rotation for GitHub. | `lib/auth.js:10` |
| **LOW** | `trustHost: true` disables host header validation. Standard for Vercel but risky behind misconfigured proxies. | `lib/auth.js:38` |
| **LOW** | Cookie name selection based on protocol could fail behind TLS-terminating reverse proxies. | `middleware.js:21-22` |

---

### 2. API Route Security

#### What's Done Well
- **100% auth coverage**: Every single API route calls `getAuthUser()` as its first operation (`lib/api-auth.js:4-10`)
- **Parameterized SQL**: Tagged template literal at `lib/db.js:6-17` — zero string-concatenated queries in the entire codebase
- **User-scoped queries**: Every DB function includes `WHERE user_id = ${userId}` or equivalent
- **HTTP method enforcement**: Next.js App Router returns 405 for unexported methods automatically
- **GitHub sync input validation**: `validateInput()` at `app/api/employees/[id]/github-sync/route.js:5-17` uses strict regex

#### Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| **HIGH** | No input validation on 5 of 6 mutation endpoints. POST/PUT bodies passed directly to DB functions with no schema validation (no zod/joi/yup). | `app/api/employees/route.js:17`, `app/api/roles/route.js:17`, `app/api/settings/route.js:17`, etc. |
| **HIGH** | No rate limiting on any endpoint. GitHub sync can trigger unbounded external API calls (5 pages × 2 searches × N months). | All routes; `app/api/employees/[id]/github-sync/route.js:30-50` |
| **MEDIUM** | No try/catch on most routes. Unhandled DB errors (constraint violations, connection failures) bubble up as uncontrolled 500s. | All routes except github-sync |
| **MEDIUM** | Error messages leaked to client including reflected user input in github-sync validation errors. | `app/api/employees/[id]/github-sync/route.js:7,135` |
| **MEDIUM** | Unbounded array fields (`personalGoals`, `teamGoals`, `extras`, `competencyAssessments`) trigger multiple SQL INSERTs in loops with no size limit. | `lib/db.js:164-211` |
| **LOW** | `parseInt(id)` on path params doesn't reject `NaN` — propagates into SQL queries. | `app/api/employees/[id]/route.js:11` |

---

### 3. Client-Side & Data Protection

#### What's Done Well
- **No XSS vectors**: Zero `dangerouslySetInnerHTML` usage. All user data rendered via JSX auto-escaping.
- **No `NEXT_PUBLIC_` variables**: All env vars are server-only.
- **No sensitive data in URLs**: All mutations via POST/PUT body, IDs are path params only.
- **Client-side file upload only**: GoalUploadModal reads `.md` files locally, no server upload.
- **Data isolation**: Every DB function scopes by `user_id`. No cross-tenant access possible.

#### Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| **HIGH** | No security headers configured anywhere. Missing: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. | `next.config.js` (no `headers()`), `middleware.js` |
| **MEDIUM** | `X-Powered-By: Next.js` not disabled — information disclosure. | `next.config.js` (missing `poweredByHeader: false`) |
| **MEDIUM** | No `images.remotePatterns` restrictions for GitHub avatar URLs rendered in components. | `next.config.js`, `components/App.jsx:180,208` |
| **LOW** | `console.error` in github-sync logs full GitHub API error response bodies server-side. | `app/api/employees/[id]/github-sync/route.js:40` |
| **LOW** | Auth debug mode enabled in non-production (`debug: process.env.NODE_ENV !== 'production'`). | `lib/auth.js:39` |

---

### 4. Middleware & Route Protection

#### What's Done Well
- **Catch-all matcher**: `/((?!_next/static|_next/image|favicon.ico).*)` — private by default
- **Defense-in-depth**: Both middleware AND per-route `getAuthUser()` checks
- **No open redirects**: All redirects hardcoded to `/`
- **No bypass vectors**: Path traversal/encoding tricks normalized by Next.js before matching
- **`_next/data` protected**: Not excluded from matcher, so SSR data routes are auth-gated

#### Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| **MEDIUM** | `/impressum` and `/datenschutz` require auth but are legal compliance pages (TMG §5, GDPR) that must be publicly accessible. | `middleware.js:42` (no exclusion) |
| **LOW** | No RBAC — single role "authenticated user". No admin controls, no permission hierarchy. | Entire codebase |

---

### 5. Infrastructure & Dependencies

#### What's Done Well
- **`.gitignore` properly configured**: `.env*.local`, `.env`, `*.pem` excluded
- **No hardcoded credentials in source**: All secrets via env vars
- **Debug routes removed**: Commit `1078bc0` cleaned these up
- **Corporate npm registry**: Packages resolve from JFrog Artifactory (supply-chain control)
- **Database TLS**: Neon enforces TLS server-side; production pool at `lib/db.js:3` uses implicit TLS

#### Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| **MEDIUM** | Migration script disables TLS cert verification: `rejectUnauthorized: false`. | `scripts/migrate.js:23` |
| **MEDIUM** | GitHub access tokens stored in plaintext in `accounts` table. | `scripts/migrate.js:61` |
| **LOW** | Dead dependency `@vercel/postgres` declared but never imported. Unnecessary attack surface. | `package.json:16` |
| **LOW** | No `.npmrc` in version control — registry config not reproducible. | Repository root |
| **INFO** | No `vercel.json` — deployment relies entirely on Vercel auto-detection defaults. | Repository root |

---

## Consolidated Findings by Severity

### CRITICAL (2)
1. **Middleware blocks NextAuth routes** — `/api/auth/*` returns 401 for unauthenticated users, breaking OAuth flow. (`middleware.js:33,42`)
2. **Redirect loop on `/`** — unauthenticated users at root get infinite redirect to `/`. (`middleware.js:35,42`)

### HIGH (6)
3. **No input validation** on 5/6 mutation endpoints — no schema enforcement. (All POST/PUT routes)
4. **No rate limiting** — any endpoint, especially github-sync with external API calls. (All routes)
5. **No security headers** — CSP, HSTS, X-Frame-Options all missing. (`next.config.js`)
6. **GitHub token in unencrypted JWT** — `repo`-scope token extractable from cookie. (`lib/auth.js:28`)
7. **GitHub token exposed to client** — via `session.accessToken`. (`lib/auth.js:34`)
8. **Pre-release auth library** — `next-auth@5.0.0-beta.30` in production. (`package.json:19`)

### MEDIUM (8)
9. **Overly broad OAuth scope** — `repo` when only read access needed. (`lib/auth.js:17`)
10. **No try/catch** on most API routes. (All routes except github-sync)
11. **Error messages leaked** to client with reflected input. (`github-sync/route.js:7,135`)
12. **Unbounded array inserts** — no size limits on goal/competency arrays. (`lib/db.js:164-211`)
13. **Legal pages behind auth** — `/impressum`, `/datenschutz` inaccessible to unauthenticated users. (`middleware.js:42`)
14. **TLS verification disabled** in migration script. (`scripts/migrate.js:23`)
15. **GitHub tokens in plaintext** in `accounts` DB table. (`scripts/migrate.js:61`)
16. **`X-Powered-By` not disabled** + no `images.remotePatterns`. (`next.config.js`)

### LOW (6)
17. `parseInt(id)` doesn't reject NaN. (`app/api/employees/[id]/route.js:11`)
18. `trustHost: true` disables host validation. (`lib/auth.js:38`)
19. Cookie name selection fragile behind TLS proxies. (`middleware.js:21-22`)
20. Debug mode in non-production. (`lib/auth.js:39`)
21. Dead dependency `@vercel/postgres`. (`package.json:16`)
22. No `.npmrc` in version control. (Repository root)

---

## Code References

- `middleware.js:1-43` — Edge middleware, route protection, maintenance mode
- `lib/auth.js:1-44` — NextAuth config, OAuth scope, JWT callbacks, token exposure
- `lib/api-auth.js:4-10` — Per-route auth helper
- `lib/db.js:6-17` — Parameterized SQL tagged template
- `lib/db.js:48-291` — All data functions with user_id scoping
- `app/api/employees/route.js` — Employee CRUD (no input validation)
- `app/api/employees/[id]/route.js` — Employee update/delete
- `app/api/employees/[id]/github-sync/route.js` — GitHub sync (only route with validation + try/catch)
- `app/api/roles/route.js` — Role CRUD (no input validation)
- `app/api/settings/route.js` — Settings (no input validation)
- `app/api/competencies/route.js` — Read-only competencies
- `next.config.js` — Minimal config, no security headers
- `scripts/migrate.js:21-24` — TLS verification disabled
- `package.json:19` — next-auth beta version
- `.env.example` — Safe template with empty placeholders

## Architecture Insights

1. **Two-layer auth** (middleware + route-level) is a strong pattern. The middleware provides early rejection at the edge, while `getAuthUser()` provides defense-in-depth.
2. **Tenant isolation via `user_id`** in every query is consistently applied — this is the most important security property for a multi-tenant HR app and it's done well.
3. **SQL injection prevention** via the tagged template literal is elegant and effective — it makes parameterized queries the path of least resistance.
4. **The biggest architectural gap** is the middleware matcher — it should explicitly exclude `/api/auth/*`, `/`, `/impressum`, and `/datenschutz` from auth checks rather than relying on redirect-to-self behavior.

## Recommendations (Priority Order)

1. **Fix middleware matcher** — exclude `/api/auth/*`, `/`, `/impressum`, `/datenschutz` from auth checks
2. **Add security headers** via `next.config.js` `headers()` — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
3. **Add input validation** — use `zod` schemas on all POST/PUT endpoints
4. **Reduce GitHub OAuth scope** — replace `repo` with `read:user user:email read:org`
5. **Stop exposing GitHub token to client** — remove `session.accessToken` from session callback; use server-side only
6. **Add rate limiting** — at minimum on github-sync, ideally on all mutation endpoints
7. **Add try/catch** to all API routes with generic error responses
8. **Upgrade next-auth** to stable release when available, or pin to a well-audited beta version
9. **Remove dead `@vercel/postgres` dependency**
10. **Fix migration script** — remove `rejectUnauthorized: false`

## Open Questions

- Has `.env.local` ever been committed to git history? If so, all secrets (AUTH_SECRET, GitHub OAuth secret, DB password) should be rotated immediately.
- Is there a plan to upgrade next-auth from beta.30 to a stable release?
- Should the GitHub sync feature use a GitHub App token (with minimal scopes) instead of the user's OAuth token?
- Are there plans for RBAC (e.g., admin vs. viewer roles)?
